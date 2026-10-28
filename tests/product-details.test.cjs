const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { test } = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { NextRequest } = require("next/server");

function load(file, overrides = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.require = (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name.startsWith("@/")) {
      const base = path.resolve(__dirname, "..", name.slice(2));
      return load([base + ".ts", base + ".tsx"].find(fs.existsSync), overrides);
    }
    if (name.startsWith(".")) {
      const base = path.resolve(path.dirname(filename), name);
      const local = [base + ".ts", base + ".tsx"].find(fs.existsSync);
      if (local) return load(local, overrides);
    }
    return require(name);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText, filename);
  return loaded.exports;
}

const product = {
  id: "AbC123",
  img: ["/BR1.jpg"],
  title: "Chocolate Brownie",
  subTitle: "Full chocolate description",
  recommended: true,
  price: 120,
};

function renderAdminProducts(state) {
  const ProductTable = load("app/(admin)/admin/products/components/ProductTable.tsx", {
    "@tanstack/react-query": { useQuery: () => state, useQueryClient: () => ({}) },
  }).default;
  return renderToStaticMarkup(React.createElement(ProductTable));
}

test("admin table displays every returned product with its price and recommendation", () => {
  const html = renderAdminProducts({ data: [{ ...product, img: ["/BR1.jpg", "/BR2.jpg"] }, {
    ...product, id: "second", title: "Original Brownie", price: 80, recommended: false,
  }], isPending: false, isError: false });
  assert.match(html, /<table/);
  assert.match(html, /src="\/BR1.jpg"/);
  assert.match(html, /alt="Chocolate Brownie"/);
  assert.doesNotMatch(html, /src="\/BR1.jpg,\/BR2.jpg"/);
  assert.match(html, /Chocolate Brownie/);
  assert.match(html, /Full chocolate description/);
  assert.match(html, /120 TWD/);
  assert.match(html, /Original Brownie/);
  assert.match(html, /80 TWD/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /fill="currentColor"/);
  assert.match(html, /fill="none"/);
  assert.match(html, />Actions</);
  assert.match(html, /Edit Chocolate Brownie/);
  assert.match(html, /href="\/admin\/products\/AbC123\/edit"/);
  assert.match(html, /Add product/);
});

test("recommendation stars toggle on each click without calling an update API", () => {
  const runtime = require("react/jsx-runtime");
  let overrides = {};
  let toggle;
  const capture = (render) => (type, props, key) => {
    if (props?.["aria-label"] === "Toggle recommendation for Chocolate Brownie") toggle = props;
    return render(type, props, key);
  };
  const ProductTable = load("app/(admin)/admin/products/components/ProductTable.tsx", {
    react: { ...React, useState: (initial) => typeof initial === "object"
      ? [overrides, (next) => { overrides = typeof next === "function" ? next(overrides) : next; }]
      : React.useState(initial) },
    "react/jsx-runtime": { ...runtime, jsx: capture(runtime.jsx), jsxs: capture(runtime.jsxs) },
    "@tanstack/react-query": {
      useQuery: () => ({ data: [product], isPending: false, isError: false }),
      useQueryClient: () => ({}),
    },
    "@/lib/http": { api: { get() { throw new Error("Unexpected request"); }, patch() { throw new Error("Unexpected update"); } } },
  }).default;
  const render = () => renderToStaticMarkup(React.createElement(ProductTable));
  render();
  assert.equal(toggle["aria-pressed"], true);
  toggle.onClick();
  render();
  assert.equal(toggle["aria-pressed"], false);
  toggle.onClick();
  render();
  assert.equal(toggle["aria-pressed"], true);
});

test("admin table distinguishes loading, empty, and failed requests", () => {
  const loading = renderAdminProducts({ isPending: true, isError: false });
  assert.match(loading, /Loading products/);
  assert.doesNotMatch(loading, /No products found/);
  const empty = renderAdminProducts({ data: [], isPending: false, isError: false });
  assert.match(empty, /No products found/);
  const error = renderAdminProducts({ isPending: false, isError: true, refetch() {} });
  assert.match(error, /role="alert"/);
  assert.match(error, /Could not load products/);
  assert.match(error, /Try again/);
  assert.doesNotMatch(error, /No products found/);
  const noImages = renderAdminProducts({ data: [{ ...product, img: [] }], isPending: false, isError: false });
  assert.match(noImages, /Currently 0 images for this product/);
  assert.doesNotMatch(noImages, /default.webp/);
});

test("product creation validates fields and strips untrusted document properties", async () => {
  const writes = [];
  const { createProduct } = load("lib/server/products.ts", {
    "@/lib/firebase/admin": { adminDb: { collection: () => ({ add: async (value) => {
      writes.push(value);
      return { id: "created" };
    } }) } },
    "firebase-admin/firestore": { FieldValue: { serverTimestamp: () => "timestamp" } },
  });
  const input = { ...product, title: "  Brownie  ", createdAt: "forged", img: ["/BR1.jpg", "/BR2.jpg"], images: ["/obsolete.jpg"] };
  assert.deepEqual(await createProduct(input), { id: "created" });
  assert.deepEqual(writes[0], {
    title: "Brownie", subTitle: product.subTitle, price: 120, img: ["/BR1.jpg", "/BR2.jpg"],
    recommended: true, createdAt: "timestamp",
  });
  for (const invalid of [
    { title: " " }, { price: -1 }, { price: "120" }, { price: Infinity },
    { img: "javascript:alert(1)" }, { img: ["bad"] }, { img: [] },
    { img: Array(22).fill("/BR1.jpg") }, { recommended: "false" },
  ]) {
    await assert.rejects(() => createProduct({ ...product, ...invalid }));
  }
  assert.equal(writes.length, 1);
});

test("product form shows a local image picker before the editable details", () => {
  const AddProductForm = load("app/(admin)/admin/products/components/ProductForm.tsx", {
    "@tanstack/react-query": { useQueryClient: () => ({}) },
  }).default;
  const html = renderToStaticMarkup(React.createElement(AddProductForm));
  for (const label of ["Product name", "Description", "Price (TWD)", "Pictures", "Recommended"]) {
    assert.match(html, new RegExp(label.replace(/[()]/g, "\\$&")));
  }
  assert.match(html, /type="submit"/);
  assert.match(html, /type="file"/);
  assert.match(html, /multiple=""/);
  assert.match(html, /Drag and drop/);
  assert.ok(html.indexOf('type="file"') < html.indexOf('name="title"'));
  assert.match(html, /Prepare images/);
  assert.match(html, /Currently 0 images for this product/);
  assert.doesNotMatch(html, /default.webp/);
});

test("product creation endpoint requires a valid unexpired session and handles failed submissions", async () => {
  const { POST } = load("app/api/v1/products/route.ts", {
    "@/config/server": { serverConfig: { authCookieName: "test_session" } },
    "@/lib/auth": { verifySession: (token) => {
      if (token === "broken") throw new Error("Invalid signature");
      if (token === "valid") return { uid: "admin", iat: Date.now() };
      if (token === "expired") return { uid: "admin", iat: 1 };
      return null;
    } },
    "@/lib/server/products": {
      createProduct: async (input) => {
        if (input.price < 0) throw new (require("zod").ZodError)([
          { code: "custom", path: ["price"], message: "Price must be non-negative." },
        ]);
        if (input.title === "fail") throw new Error("Private database failure");
        return { id: "created" };
      },
    },
  });
  const request = (token, body) => new NextRequest("https://example.com/api/v1/products", {
    method: "POST", headers: token ? { cookie: `test_session=${token}` } : {}, body,
  });
  for (const token of [null, "forged", "broken", "expired"]) {
    assert.equal((await POST(request(token, JSON.stringify(product)))).status, 401);
  }
  assert.equal((await POST(request("valid", "{"))).status, 400);
  assert.equal((await POST(request("valid", JSON.stringify({ ...product, price: -1 })))).status, 400);
  const saved = await POST(request("valid", JSON.stringify(product)));
  assert.equal(saved.status, 201);
  assert.deepEqual(await saved.json(), { data: { id: "created" } });
  const failure = await POST(request("valid", JSON.stringify({ ...product, title: "fail" })));
  assert.equal(failure.status, 500);
  assert.doesNotMatch(JSON.stringify(await failure.json()), /Private database/);
});

test("edit page shows multiple pictures above a prefilled product form", async () => {
  const Page = load("app/(admin)/admin/products/[id]/edit/page.tsx", {
    "@/lib/server/products": { getProduct: async (id) => {
      assert.equal(id, "AbC123");
      return { ...product, img: ["/BR1.jpg", "/BR2.jpg", "/BR3.jpg"] };
    } },
    "@tanstack/react-query": { useQueryClient: () => ({}) },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
  }).default;
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: "AbC123" }) }));
  assert.match(html, /href="\/admin\/products"/);
  assert.match(html, /src="\/BR1.jpg"/);
  assert.match(html, /src="\/BR3.jpg"/);
  assert.ok(html.indexOf('/BR3.jpg') < html.indexOf('name="title"'));
  assert.match(html, /name="title"[^>]*value="Chocolate Brownie"/);
  assert.match(html, /name="price"[^>]*value="120"/);
  assert.match(html, /Full chocolate description/);
  assert.match(html, /Prepare images/);
});

test("edit page returns not found for an unknown product", async () => {
  const Page = load("app/(admin)/admin/products/[id]/edit/page.tsx", {
    "@/lib/server/products": { getProduct: async () => null },
    "next/navigation": { notFound() { throw new Error("NOT_FOUND"); } },
  }).default;
  await assert.rejects(() => Page({ params: Promise.resolve({ id: "missing" }) }), /NOT_FOUND/);
});

test("updating a product preserves its identity and creation data and never creates missing records", async () => {
  const writes = [];
  const { updateProduct } = load("lib/server/products.ts", {
    "@/lib/firebase/admin": { adminDb: { collection: () => ({ doc: (id) => ({ update: async (value) => {
      if (id === "missing") throw Object.assign(new Error("not found"), { code: 5 });
      writes.push({ id, value });
    } }) }) } },
    "firebase-admin/firestore": { FieldValue: { serverTimestamp: () => "timestamp" } },
  });
  assert.deepEqual(await updateProduct("AbC123", { ...product, title: "Updated", createdAt: "forged" }), { id: "AbC123" });
  assert.equal(writes[0].value.title, "Updated");
  assert.equal(writes[0].value.updatedAt, "timestamp");
  assert.equal(writes[0].value.id, undefined);
  assert.equal(writes[0].value.createdAt, undefined);
  assert.equal(await updateProduct("missing", product), null);
  assert.equal(await updateProduct("one/two", product), null);
  await assert.rejects(() => updateProduct("AbC123", { ...product, price: -1 }));
  assert.equal(writes.length, 1);
});

test("product update endpoint checks the session, validates input, and reports missing records", async () => {
  const { PATCH } = load("app/api/v1/products/[id]/route.ts", {
    "@/config/server": { serverConfig: { authCookieName: "test_session" } },
    "@/lib/server/product-session": { hasProductWriteSession: (token) => token === "valid" },
    "@/lib/server/products": { updateProduct: async (id, input) => {
      const { productSchema } = load("schemas/product.ts");
      productSchema.parse(input);
      return id === "missing" ? null : { id };
    } },
  });
  const request = (token, body = JSON.stringify(product)) => new NextRequest("https://example.com/api/v1/products/AbC123", {
    method: "PATCH", body, headers: token ? { cookie: `test_session=${token}` } : {},
  });
  const context = (id = "AbC123") => ({ params: Promise.resolve({ id }) });
  assert.equal((await PATCH(request(), context())).status, 401);
  assert.equal((await PATCH(request("valid", "{"), context())).status, 400);
  assert.equal((await PATCH(request("valid", JSON.stringify({ ...product, price: -1 })), context())).status, 400);
  assert.equal((await PATCH(request("valid"), context("missing"))).status, 404);
  const response = await PATCH(request("valid"), context());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { id: "AbC123" } });
});

test("lossless WebP encoding preserves dimensions and every RGBA pixel", async () => {
  const codec = await import("@jsquash/webp/encode.js");
  const { simd } = await import("wasm-feature-detect");
  const wasmName = await simd() ? "webp_enc_simd.wasm" : "webp_enc.wasm";
  await codec.init({ wasmBinary: fs.readFileSync(path.join(path.dirname(require.resolve("@jsquash/webp")), "codec/enc", wasmName)) });
  const { encodeLosslessWebP } = load("lib/images/lossless-webp.ts", {
    "@jsquash/webp/encode.js": { __esModule: true, default: codec.default },
  });
  const pixels = new Uint8ClampedArray([
    255, 0, 0, 255, 0, 255, 0, 255,
    12, 34, 56, 128, 200, 100, 50, 0,
  ]);
  const output = await encodeLosslessWebP({ data: pixels, width: 2, height: 2 });
  assert.equal(output.type, "image/webp");
  const decoded = await require("sharp")(Buffer.from(await output.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(decoded.info.width, 2);
  assert.equal(decoded.info.height, 2);
  assert.deepEqual([...decoded.data], [...pixels]);
});

test("image controls select a cover, reorder, and remove without changing source files", () => {
  const runtime = require("react/jsx-runtime");
  let controls = {};
  const capture = (render) => (type, props, key) => {
    if (props?.["aria-label"]) controls[props["aria-label"]] = props;
    return render(type, props, key);
  };
  const ProductImages = load("app/(admin)/admin/products/components/ProductImages.tsx", {
    "react/jsx-runtime": { ...runtime, jsx: capture(runtime.jsx), jsxs: capture(runtime.jsxs) },
  }).default;
  let images = [
    { id: "one", url: "/BR1.jpg", name: "First" },
    { id: "two", url: "/BR2.jpg", name: "Second" },
    { id: "three", url: "/BR3.jpg", name: "Third" },
  ];
  const render = () => {
    controls = {};
    return renderToStaticMarkup(React.createElement(ProductImages, { images, onChange: (value) => { images = value; }, disabled: false }));
  };
  render();
  controls["Use Third as cover"].onClick();
  assert.deepEqual(images.map((image) => image.id), ["three", "one", "two"]);
  render();
  controls["Move Third later"].onClick();
  assert.deepEqual(images.map((image) => image.id), ["one", "three", "two"]);
  render();
  controls["Remove Third"].onClick();
  assert.deepEqual(images.map((image) => image.id), ["one", "two"]);
});

test("dragging an image row to the top makes it the required cover", () => {
  const runtime = require("react/jsx-runtime");
  let rows = [];
  const capture = (render) => (type, props, key) => {
    if (type === "li") rows.push(props);
    return render(type, props, key);
  };
  const ProductImages = load("app/(admin)/admin/products/components/ProductImages.tsx", {
    "react/jsx-runtime": { ...runtime, jsx: capture(runtime.jsx), jsxs: capture(runtime.jsxs) },
  }).default;
  let images = [
    { id: "first", url: "/BR1.jpg", name: "First" },
    { id: "second", url: "/BR2.jpg", name: "Second" },
    { id: "third", url: "/BR3.jpg", name: "Third" },
  ];
  const render = (disabled = false) => {
    rows = [];
    return renderToStaticMarkup(React.createElement(ProductImages, {
      images, disabled, onChange: (value) => { images = value; },
    }));
  };
  render();
  assert.equal(rows[2].draggable, true);
  rows[2].onDragStart({ dataTransfer: { setData() {} } });
  rows[0].onDrop({ preventDefault() {}, stopPropagation() {}, dataTransfer: { files: [] } });
  assert.deepEqual(images.map((image) => image.id), ["third", "first", "second"]);
  const html = render();
  assert.match(html, /Third is the cover/);
  assert.match(html, /Cover image · Required/);
  assert.match(html, /type="button"[^>]*>Preview</);
  render(true);
  assert.equal(rows[0].draggable, false);
});

test("file selection and dropping files both create local previews and reject unsupported files", (t) => {
  const runtime = require("react/jsx-runtime");
  let picker;
  let drop;
  let images = [];
  const urls = [];
  t.after(() => urls.forEach((url) => URL.revokeObjectURL(url)));
  const capture = (render) => (type, props, key) => {
    if (type === "input" && props.type === "file") picker = props;
    if (type === "div" && props?.onDrop) drop = props.onDrop;
    return render(type, props, key);
  };
  const ProductImages = load("app/(admin)/admin/products/components/ProductImages.tsx", {
    "react/jsx-runtime": { ...runtime, jsx: capture(runtime.jsx), jsxs: capture(runtime.jsxs) },
  }).default;
  const render = () => renderToStaticMarkup(React.createElement(ProductImages, {
    images, disabled: false, onChange: (value) => { images = value; urls.push(...value.map((image) => image.url)); },
  }));
  const first = new File(["first"], "first.png", { type: "image/png" });
  const second = new File(["second"], "second.jpg", { type: "image/jpeg" });
  render();
  picker.onChange({ currentTarget: { files: [first], value: "first.png" } });
  assert.equal(images[0].file, first);
  assert.match(images[0].url, /^blob:/);
  render();
  drop({ preventDefault() {}, dataTransfer: { files: [second] } });
  assert.equal(images[1].file, second);
  render();
  drop({ preventDefault() {}, dataTransfer: { files: [new File(["bad"], "bad.svg", { type: "image/svg+xml" })] } });
  assert.equal(images.length, 2);
});

test("submitting product pictures only encodes locally and logs original and resulting sizes", async (t) => {
  const runtime = require("react/jsx-runtime");
  const file = new File([new Uint8Array(1000)], "photo.png", { type: "image/png" });
  const logs = [];
  let submit;
  let encodes = 0;
  let writes = 0;
  const capture = (render) => (type, props, key) => {
    if (type === "form") submit = props.onSubmit;
    return render(type, props, key);
  };
  const ProductForm = load("app/(admin)/admin/products/components/ProductForm.tsx", {
    react: { ...React, useState: (initial) => React.useState(typeof initial === "function"
      ? () => [{ id: "local", name: file.name, url: "blob:local", file }] : initial) },
    "react/jsx-runtime": { ...runtime, jsx: capture(runtime.jsx), jsxs: capture(runtime.jsxs) },
    "@/lib/images/encode-webp": { encodeLocalImage: async (input) => {
      assert.equal(input, file);
      encodes++;
      return new Blob([new Uint8Array(100)], { type: "image/webp" });
    } },
    "@/lib/api/products": {
      createProduct() { writes++; throw new Error("Must not create products"); },
      updateProduct() { writes++; throw new Error("Must not update products"); },
    },
    "@/lib/http": { api: {
      post() { writes++; throw new Error("Must not upload"); },
      patch() { writes++; throw new Error("Must not update"); },
    } },
  }).default;
  renderToStaticMarkup(React.createElement(ProductForm));
  const originalFormData = globalThis.FormData;
  const originalLog = console.log;
  t.after(() => { globalThis.FormData = originalFormData; console.log = originalLog; });
  globalThis.FormData = class { constructor(form) { return form; } };
  console.log = (...args) => logs.push(args);
  await submit({ preventDefault() {}, currentTarget: { get: (key) => ({
    title: "Brownie", subTitle: "Description", price: "120", recommended: "on",
  })[key] ?? null } });
  assert.equal(encodes, 1);
  assert.equal(writes, 0);
  assert.equal(logs.length, 1);
  assert.equal(logs[0][1].name, "photo.png");
  assert.equal(logs[0][1].beforeBytes, 1000);
  assert.equal(logs[0][1].afterBytes, 100);
});

test("cards show the photo and name without details or controls", () => {
  const Card = load("components/ProductCard.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Card, { ...product, img: ["/BR1.jpg", "/BR2.jpg"] }));
  assert.match(html, /src="\/BR1.jpg"/);
  assert.doesNotMatch(html, /src="[^"]*BR2.jpg/);
  assert.match(html, /alt="Chocolate Brownie"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, />Chocolate Brownie</);
  assert.doesNotMatch(html, /Full chocolate description|120|House favorite|<button/);
  for (const img of [[], undefined, [""]]) {
    const fallback = renderToStaticMarkup(React.createElement(Card, { ...product, img }));
    assert.match(fallback, /src="\/default.webp"/);
  }
});

test("showcase links each card to its product ID, including encoded characters", () => {
  const { ProductShowcase } = load("components/ProductsShowcase.tsx", {
    "@/lib/firebase": { getDB: () => ({}) },
    "firebase/firestore": { collection: () => ({}), orderBy: () => ({}), query: () => ({}) },
    "@/hooks/use-firestore": { useCollectionLive: () => ({ data: [product, { ...product, id: "A B?123" }] }) },
  });
  const html = renderToStaticMarkup(React.createElement(ProductShowcase, { items: [], showAdd: false }));
  assert.match(html, /href="\/products\/AbC123"/);
  assert.match(html, /href="\/products\/A%20B%3F123"/);
});

test("product lookup uses the exact ID and returns the document ID", async () => {
  const { getProduct } = load("lib/server/products.ts", {
    "@/lib/firebase/admin": { adminDb: {
      collection(name) {
        assert.equal(name, "product");
        return { doc(id) {
          assert.equal(id, "AbC123");
          return { get: async () => ({ exists: true, id, data: () => ({ ...product, id: "stale" }) }) };
        } };
      },
    } },
  });
  assert.deepEqual(await getProduct("AbC123"), product);
});

test("missing and invalid document IDs produce no product", async () => {
  let reads = 0;
  const { getProduct } = load("lib/server/products.ts", {
    "@/lib/firebase/admin": { adminDb: {
      collection() { return { doc() { reads++; return { get: async () => ({ exists: false }) }; } }; },
    } },
  });
  for (const id of ["", "one/two/three", ".", ".."]) assert.equal(await getProduct(id), null);
  assert.equal(reads, 0);
  assert.equal(await getProduct("missing"), null);
  assert.equal(reads, 1);
});

test("detail page renders the selected product's full details", async () => {
  const Page = load("app/(user)/products/[id]/page.tsx", {
    "@/lib/server/products": { getProduct: async (id) => {
      assert.equal(id, product.id);
      return product;
    } },
  }).default;
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: product.id }) }));
  assert.match(html, /Chocolate Brownie/);
  assert.match(html, /Full chocolate description/);
  assert.match(html, /120 TWD/);
  assert.match(html, /href="\/products"/);
  assert.match(html, /Add to cart/);
});

test("gallery supports a single-image product array", () => {
  const Gallery = load("components/ProductGallery.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Gallery, product));
  assert.match(html, /src="\/BR1.jpg"/);
  assert.match(html, /aria-label="View photo 1 of Chocolate Brownie"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 1);
});

test("gallery uses the img array without duplicate or empty thumbnails", () => {
  const Gallery = load("components/ProductGallery.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Gallery, {
    ...product, img: ["/BR1.jpg", "", "/CC1.jpg", "/CC2.jpg", "/CC1.jpg"],
  }));
  assert.equal((html.match(/role="tab"/g) || []).length, 3);
  assert.match(html, /src="\/CC1.jpg"/);
  assert.match(html, /src="\/CC2.jpg"/);
  assert.match(html, /aria-label="View photo 3 of Chocolate Brownie"/);
});

test("gallery shows the default picture when there are no product photos", () => {
  const Gallery = load("components/ProductGallery.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Gallery, { title: product.title, img: [] }));
  assert.match(html, /src="\/default.webp"/);
  assert.match(html, /alt="Chocolate Brownie"/);
  assert.doesNotMatch(html, /role="tab"/);
});

test("detail page passes additional product photos into the gallery", async () => {
  const Page = load("app/(user)/products/[id]/page.tsx", {
    "@/lib/server/products": { getProduct: async () => ({ ...product, img: ["/BR1.jpg", "/CC1.jpg"] }) },
  }).default;
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: product.id }) }));
  assert.match(html, /aria-label="View photo 2 of Chocolate Brownie"/);
  assert.match(html, /src="\/CC1.jpg"/);
});

test("missing products return Next's not-found response", async () => {
  const Page = load("app/(user)/products/[id]/page.tsx", {
    "@/lib/server/products": { getProduct: async () => null },
  }).default;
  await assert.rejects(Page({ params: Promise.resolve({ id: "missing" }) }),
    (error) => error.digest === "NEXT_HTTP_ERROR_FALLBACK;404");
});

test("URL normalization preserves case-sensitive product IDs", () => {
  const { middleware } = load("middleware.ts");
  const response = middleware(new NextRequest("https://example.com/products/AbC123"));
  assert.equal(response.headers.get("location"), null);
  const normalized = middleware(new NextRequest("https://example.com/Products/AbC123"));
  assert.equal(normalized.headers.get("location"), "https://example.com/products/AbC123");
  const admin = middleware(new NextRequest("https://example.com/Admin"));
  assert.equal(admin.headers.get("location"), "https://example.com/admin");
});

test("admin edit URLs preserve mixed-case product IDs while normalizing route names", () => {
  const { middleware } = load("middleware.ts");
  const response = middleware(new NextRequest("https://example.com/admin/products/AbC123/edit", {
    headers: { cookie: "BMT_COOKIE=session" },
  }));
  assert.equal(response.headers.get("location"), null);
  const normalized = middleware(new NextRequest("https://example.com/Admin/Products/AbC123/Edit"));
  assert.equal(normalized.headers.get("location"), "https://example.com/admin/products/AbC123/edit");
});

test("pickup availability uses Taipei dates, weekends and the inclusive 21-day window", () => {
  const { getTaipeiDate, isPickupDateAvailable, getDefaultPickupDate } = load("lib/pickup.ts");
  assert.equal(getTaipeiDate(new Date("2026-10-30T16:30:00Z")), "2026-10-31");
  assert.equal(getDefaultPickupDate("2026-10-27"), "2026-10-31");
  assert.equal(getDefaultPickupDate("2026-11-01"), "2026-11-01");
  assert.equal(isPickupDateAvailable("2026-10-31", "2026-10-27"), true);
  assert.equal(isPickupDateAvailable("2026-11-01", "2026-10-27"), true);
  assert.equal(isPickupDateAvailable("2026-10-28", "2026-10-27"), false);
  assert.equal(isPickupDateAvailable("2026-10-25", "2026-10-27"), false);
  assert.equal(isPickupDateAvailable("2026-11-21", "2026-10-31"), true);
  assert.equal(isPickupDateAvailable("2026-11-22", "2026-10-31"), false);
  assert.equal(isPickupDateAvailable("2026-02-30", "2026-02-20"), false);
  assert.equal(getDefaultPickupDate("2026-12-30"), "2027-01-02");
});

test("order schema supplies valid defaults and rejects unsupported sizes and quantities", () => {
  const { createProductOrderSchema, getProductOrderDefaults } = load("schemas/product-order.ts");
  const schema = createProductOrderSchema("2026-10-27");
  const defaults = getProductOrderDefaults("2026-10-27");
  assert.deepEqual(defaults, { size: "18", pickupDate: "2026-10-31", quantity: 1 });
  assert.equal(schema.safeParse(defaults).success, true);
  assert.equal(schema.safeParse({ ...defaults, size: "25", quantity: 5 }).success, true);
  for (const quantity of [0, 6, 1.5, NaN]) {
    assert.equal(schema.safeParse({ ...defaults, quantity }).success, false);
  }
  assert.equal(schema.safeParse({ ...defaults, size: "30" }).success, false);
  assert.equal(schema.safeParse({ ...defaults, pickupDate: "2026-10-28" }).success, false);
  assert.equal(schema.safeParse({ ...defaults, pickupDate: "2026-11-21" }).success, false);
});

test("order form shows the quantity total and one submit action", () => {
  const hookForm = require("react-hook-form");
  const OrderForm = load("components/Forms/ProductOrderForm.tsx", {
    "react-hook-form": {
      ...hookForm,
      useForm: (options) => hookForm.useForm({
        ...options, defaultValues: { ...options.defaultValues, quantity: 3 },
      }),
    },
  }).default;
  const html = renderToStaticMarkup(React.createElement(OrderForm, { product, today: "2026-10-27" }));
  assert.match(html, /Unit price/);
  assert.match(html, /120 TWD/);
  assert.match(html, /360 TWD/);
  assert.equal((html.match(/type="submit"/g) || []).length, 1);
  assert.match(html, /Add to cart/);
  assert.doesNotMatch(html, /Buy it now/);
});

test("cart combines selections, enforces five, rehydrates, and rolls back failed saves", async (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const saved = new Map();
  let failWrites = false;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => {
      if (failWrites) throw new Error("Browser storage is full");
      saved.set(key, value);
    },
    removeItem: (key) => saved.delete(key),
  } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  });
  const { getProductOrderDefaults } = load("schemas/product-order.ts");
  const values = getProductOrderDefaults();
  const { useCartStore } = load("stores/cart.ts");
  await useCartStore.persist.rehydrate();
  useCartStore.getState().addItem(product, { ...values, quantity: 2 });
  useCartStore.getState().addItem(product, { ...values, quantity: 3 });
  assert.equal(useCartStore.getState().items.length, 1);
  assert.equal(useCartStore.getState().items[0].quantity, 5);
  assert.throws(() => useCartStore.getState().addItem(product, values), /maximum.*5/i);
  assert.equal(useCartStore.getState().items[0].quantity, 5);
  useCartStore.getState().addItem(product, { ...values, size: "25" });
  useCartStore.getState().addItem({ ...product, id: "Other" }, values);
  const { addPickupDays } = load("lib/pickup.ts");
  useCartStore.getState().addItem(product, { ...values, pickupDate: addPickupDays(values.pickupDate, 7) });
  assert.equal(useCartStore.getState().items.length, 4);
  assert.throws(() => useCartStore.getState().addItem(product, { ...values, quantity: 6 }));
  const serialized = JSON.parse(saved.get("bmt-cart"));
  assert.equal(serialized.state.items[0].title, product.title);
  assert.equal(serialized.state.items[0].price, product.price);
  assert.equal(serialized.state.items[0].img, "/BR1.jpg");
  const fresh = load("stores/cart.ts").useCartStore;
  assert.deepEqual(fresh.getState().items, []);
  await fresh.persist.rehydrate();
  assert.deepEqual(fresh.getState().items, useCartStore.getState().items);
  const beforeFailure = fresh.getState().items;
  const savedBeforeFailure = saved.get("bmt-cart");
  failWrites = true;
  assert.throws(() => fresh.getState().addItem({ ...product, id: "Unsaved" }, values), /storage is full/);
  assert.deepEqual(fresh.getState().items, beforeFailure);
  assert.equal(saved.get("bmt-cart"), savedBeforeFailure);
});

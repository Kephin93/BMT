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
  img: "/BR1.jpg",
  title: "Chocolate Brownie",
  subTitle: "Full chocolate description",
  recommended: true,
  price: 120,
};

test("cards show the photo and name without details or controls", () => {
  const Card = load("components/ProductCard.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Card, product));
  assert.match(html, /alt="Chocolate Brownie"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, />Chocolate Brownie</);
  assert.doesNotMatch(html, /Full chocolate description|120|House favorite|<button/);
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

test("gallery supports existing single-cover products", () => {
  const Gallery = load("components/ProductGallery.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Gallery, product));
  assert.match(html, /src="\/BR1.jpg"/);
  assert.match(html, /aria-label="View photo 1 of Chocolate Brownie"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 1);
});

test("gallery includes additional photos without duplicate or empty thumbnails", () => {
  const Gallery = load("components/ProductGallery.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Gallery, {
    ...product, images: ["/BR1.jpg", "", "/CC1.jpg", "/CC2.jpg", "/CC1.jpg"],
  }));
  assert.equal((html.match(/role="tab"/g) || []).length, 3);
  assert.match(html, /src="\/CC1.jpg"/);
  assert.match(html, /src="\/CC2.jpg"/);
  assert.match(html, /aria-label="View photo 3 of Chocolate Brownie"/);
});

test("gallery shows a placeholder when there are no photos", () => {
  const Gallery = load("components/ProductGallery.tsx").default;
  const html = renderToStaticMarkup(React.createElement(Gallery, { title: product.title, img: "", images: [] }));
  assert.match(html, /Image unavailable/);
  assert.doesNotMatch(html, /<img/);
});

test("detail page passes additional product photos into the gallery", async () => {
  const Page = load("app/(user)/products/[id]/page.tsx", {
    "@/lib/server/products": { getProduct: async () => ({ ...product, images: ["/CC1.jpg"] }) },
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

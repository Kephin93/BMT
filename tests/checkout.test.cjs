const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { test } = require("node:test");
const ts = require("typescript");

function load(file, overrides = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.require = name => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name.startsWith("@/")) {
      const base = path.resolve(__dirname, "..", name.slice(2));
      return load([base + ".ts", base + ".tsx"].find(fs.existsSync), overrides);
    }
    return require(name);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
  return loaded.exports;
}

const request = {
  requestId: "af3cd711-52b9-49ec-a631-729169653287",
  customerName: " Cake Lover ",
  lineId: " cake.line ",
  items: [
    { productId: "cake", size: "18", quantity: 1, pickupDate: "2026-11-07" },
    { productId: "cake", size: "18", quantity: 2, pickupDate: "2026-10-31" },
    { productId: "cake", size: "25", quantity: 1, pickupDate: "2026-11-01" },
  ],
};

function database(events = []) {
  const saved = new Map();
  let fail = false;
  const products = new Map([["cake", { title: "Homemade cake", img: "/cake.jpg", price: 120 }]]);
  const db = {
    collection: name => ({ doc: id => ({ path: `${name}/${id}`, id }) }),
    async runTransaction(callback) {
      const pending = new Map();
      const snapshot = ref => ({ exists: saved.has(ref.path), data: () => saved.get(ref.path) });
      const result = await callback({
        get: async ref => snapshot(ref),
        getAll: async (...refs) => refs.map(ref => ({ exists: products.has(ref.id), data: () => products.get(ref.id) })),
        set: (ref, value) => pending.set(ref.path, value),
      });
      if (fail) throw new Error("Database unavailable");
      for (const [key, value] of pending) saved.set(key, value);
      return result;
    },
  };
  const service = load("lib/server/orders.ts", {
    "@/constant/discount-events": { discountEvents: events },
    "@/lib/firebase/admin": { adminDb: db },
    "firebase-admin/firestore": { FieldValue: { serverTimestamp: () => "timestamp" } },
  });
  return { ...service, saved, products, failCommit: () => { fail = true; } };
}

test("cart groups dates chronologically", () => {
  const { groupCartByDate } = load("lib/cart.ts");
  const groups = groupCartByDate(request.items);
  assert.deepEqual(groups.map(group => group.pickupDate), ["2026-10-31", "2026-11-01", "2026-11-07"]);
  assert.equal(groups[0].items[0].quantity, 2);
});

test("numeric discounts calculate percentages and NTD amounts with thresholds and zero floor", () => {
  const { calculateOrderPricing } = load("lib/discounts.ts");
  const event = (type, value, minimumOrderAmount = 0) => ({
    id: "offer", title: "Cake offer", description: "Details", active: true,
    discount: { type, value, minimumOrderAmount },
  });
  const items = [{ price: 120, quantity: 2 }];
  assert.equal(calculateOrderPricing(items, [event(1, 10)]).total, 216);
  assert.equal(calculateOrderPricing(items, [event(2, 100)]).total, 140);
  assert.equal(calculateOrderPricing(items, [event(2, 500)]).total, 0);
  assert.equal(calculateOrderPricing(items, [event(1, 10, 300)]).total, 240);
  assert.equal(calculateOrderPricing(items, [event(1, 10, 240)]).total, 216);
  assert.equal(calculateOrderPricing(items, [{ ...event(2, 100), active: false }]).total, 240);
  assert.equal(calculateOrderPricing(items, []).total, 240);
  assert.equal(calculateOrderPricing(items, [event(1, 10), event(2, 100)]).total, 140);
  for (const offer of [event(1, -1), event(1, 101), event(2, NaN), event(3, 100)]) {
    assert.equal(calculateOrderPricing(items, [offer]).total, 240);
  }
  assert.equal(calculateOrderPricing([{ price: 99.99, quantity: 1 }], [event(1, 10)]).total, 89.99);
});

test("server applies configured discounts per date and saves the applied rule", async () => {
  for (const [type, value, expected] of [[1, 10, 432], [2, 100, 180]]) {
    const { registerOrders, saved } = database([{
      id: "offer", title: "Cake offer", description: "Details", active: true,
      discount: { type, value, minimumOrderAmount: 0 },
    }]);
    const result = await registerOrders({ ...request, discountAmount: 99999 }, "2026-10-27");
    assert.equal(result.total, expected);
    assert.equal(result.discountAmount, 480 - expected);
    const order = saved.get(`orders/${request.requestId}-2026-10-31`);
    assert.equal(order.subtotal, 240);
    assert.equal(order.appliedDiscount.type, type);
    assert.equal(order.appliedDiscount.value, value);
    assert.equal(order.total, type === 1 ? 216 : 140);
    assert.equal((await registerOrders(request, "2026-10-27")).total, expected);
  }
});

test("discount delivery ranges are inclusive and independent of order submission date", async () => {
  const event = {
    id: "dated", title: "November cakes", description: "Eligible delivery dates only", active: true,
    deliveryDateFrom: "2026-11-01", deliveryDateTo: "2026-11-07",
    discount: { type: 1, value: 10 },
  };
  const service = database([event]);
  const result = await service.registerOrders(request, "2026-10-27");
  assert.deepEqual(result.orders.map(order => order.discountAmount), [0, 12, 12]);
  assert.equal(result.total, 456);
  assert.equal(result.orders[1].appliedDiscount.deliveryDateFrom, event.deliveryDateFrom);
  assert.equal(result.orders[1].appliedDiscount.deliveryDateTo, event.deliveryDateTo);
  const { calculateOrderPricing } = load("lib/discounts.ts");
  const items = [{ price: 120, quantity: 1 }];
  assert.equal(calculateOrderPricing(items, [event], "2026-11-08").discountAmount, 0);
  assert.equal(calculateOrderPricing(items, [{ ...event, deliveryDateFrom: "2026-11-07", deliveryDateTo: "2026-11-01" }], "2026-11-07").discountAmount, 0);
  assert.equal(calculateOrderPricing(items, [{ ...event, deliveryDateTo: "2026-02-30" }], "2026-11-01").discountAmount, 0);
  assert.equal(calculateOrderPricing(items, [{ ...event, deliveryDateFrom: undefined }], "2026-10-31").discountAmount, 12);
  assert.equal(calculateOrderPricing(items, [{ ...event, deliveryDateTo: undefined }], "2026-11-08").discountAmount, 12);
});

test("checkout requires customer details, valid dates, products and quantities", () => {
  const { checkoutSchema } = load("schemas/checkout.ts");
  assert.equal(checkoutSchema.parse(request).customerName, "Cake Lover");
  for (const patch of [{ customerName: " " }, { lineId: " " }, { items: [] }, { requestId: "invalid" }]) {
    assert.equal(checkoutSchema.safeParse({ ...request, ...patch }).success, false);
  }
  for (const patch of [{ productId: "../bad" }, { quantity: 6 }, { pickupDate: "not-a-date" }]) {
    assert.equal(checkoutSchema.safeParse({ ...request, items: [{ ...request.items[0], ...patch }] }).success, false);
  }
});

test("three dates create three orders with shared customer details and server prices", async () => {
  const { registerOrders, saved } = database();
  const result = await registerOrders({ ...request, items: request.items.map(item => ({ ...item, price: 1 })) }, "2026-10-27");
  assert.equal(result.orders.length, 3);
  assert.equal(result.total, 480);
  const orders = [...saved].filter(([key]) => key.startsWith("orders/")).map(([, value]) => value);
  assert.equal(orders.length, 3);
  assert.deepEqual(orders.map(order => order.pickupDate), ["2026-10-31", "2026-11-01", "2026-11-07"]);
  for (const order of orders) {
    assert.equal(order.customerName, "Cake Lover");
    assert.equal(order.lineId, "cake.line");
    assert.equal(order.items[0].price, 120);
  }
});

test("retrying a submission returns its orders without creating duplicates", async () => {
  const { registerOrders, saved } = database();
  const first = await registerOrders(request, "2026-10-27");
  assert.deepEqual(await registerOrders(request, "2026-10-27"), first);
  assert.equal(saved.size, 4);
  await assert.rejects(registerOrders({ ...request, customerName: "Someone else" }, "2026-10-27"), /different submission/i);
});

test("invalid dates, missing products and duplicate quantities save no orders", async () => {
  for (const items of [
    [{ ...request.items[0], pickupDate: "2026-10-28" }],
    [{ ...request.items[0], pickupDate: "2026-10-25" }],
    [{ ...request.items[0], productId: "missing" }],
    [{ ...request.items[0], quantity: 3 }, { ...request.items[0], quantity: 3 }],
  ]) {
    const { registerOrders, saved } = database();
    await assert.rejects(registerOrders({ ...request, items }, "2026-10-27"));
    assert.equal(saved.size, 0);
  }
});

test("a failed transaction leaves no partially registered orders", async () => {
  const { registerOrders, saved, failCommit } = database();
  failCommit();
  await assert.rejects(registerOrders(request, "2026-10-27"), /Database unavailable/);
  assert.equal(saved.size, 0);
});

test("cart shows customer fields above three chronological order groups", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const items = request.items.map(item => ({ ...item, title: "Homemade cake", img: "/cake.jpg", price: 120 }));
  let stateIndex = 0;
  const Cart = load("components/Cart.tsx", {
    react: { ...React, useState: initial => React.useState(stateIndex++ === 0 ? true : initial) },
    "@/stores/cart": { useCartStore: selector => selector({ items, removeItem() {}, removeSubmittedItems() {} }) },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Cart));
  assert.match(html, /name="customerName"/);
  assert.match(html, /name="lineId"/);
  assert.ok(html.indexOf('name="lineId"') < html.indexOf('id="date-2026-10-31"'));
  assert.ok(html.indexOf('id="date-2026-10-31"') < html.indexOf('id="date-2026-11-01"'));
  assert.ok(html.indexOf('id="date-2026-11-01"') < html.indexOf('id="date-2026-11-07"'));
  assert.match(html, /Submit 3 pre-orders/);
  assert.match(html, /480 TWD/);
  assert.equal((html.match(/aria-label="Remove /g) || []).length, 3);
});

test("cart shows only active discount events between the item list and total", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  function render(events) {
    let stateIndex = 0;
    const Cart = load("components/Cart.tsx", {
      react: { ...React, useState: initial => React.useState(stateIndex++ === 0 ? true : initial) },
      "@/constant/discount-events": { discountEvents: events },
      "@/stores/cart": { useCartStore: selector => selector({
        items: [{ ...request.items[0], title: "Homemade cake", img: "/cake.jpg", price: 120 }],
      }) },
    }).default;
    return renderToStaticMarkup(React.createElement(Cart));
  }
  const inactive = { id: "old", title: "Past offer", description: "Not available", active: false, discount: { type: 1, value: 10 } };
  assert.doesNotMatch(render([]), /Discount events/);
  assert.doesNotMatch(render([inactive]), /Discount events|Past offer/);
  const html = render([inactive, { id: "special", title: "Cake celebration", description: "Ask us about this event on LINE.", active: true, discount: { type: 1, value: 10 } }]);
  assert.match(html, /Discount events/);
  assert.match(html, /Cake celebration/);
  assert.match(html, /10% off/);
  assert.match(html, /108 TWD/);
  assert.match(html, /Ask us about this event on LINE\./);
  assert.doesNotMatch(html, /Past offer/);
  assert.ok(html.indexOf("Order total:") < html.indexOf("Discount events"));
  assert.ok(html.indexOf("Discount events") < html.indexOf("<footer"));
});

test("cart removal and successful checkout preserve other selections and roll back storage failures", async t => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let failWrites = false;
  const saved = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => { if (failWrites) throw new Error("Storage unavailable"); saved.set(key, value); },
    removeItem: key => saved.delete(key),
  } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  });
  const { useCartStore } = load("stores/cart.ts");
  await useCartStore.persist.rehydrate();
  const { getProductOrderDefaults } = load("schemas/product-order.ts");
  const values = getProductOrderDefaults();
  const product = { id: "cake", title: "Cake", img: "/cake.jpg", price: 120 };
  useCartStore.getState().addItem(product, values);
  const requestId = useCartStore.getState().prepareCheckout("same submission");
  const service = database();
  const payload = { ...request, requestId, items: useCartStore.getState().items };
  const committed = await service.registerOrders(payload);
  // Simulate losing the committed response, then reloading the unchanged local cart.
  const reloaded = load("stores/cart.ts").useCartStore;
  await reloaded.persist.rehydrate();
  assert.equal(reloaded.getState().prepareCheckout("same submission"), requestId);
  const retry = await service.registerOrders({ ...payload, requestId: reloaded.getState().prepareCheckout("same submission") });
  assert.deepEqual(retry, committed);
  assert.equal(service.saved.size, 2);
  assert.notEqual(reloaded.getState().prepareCheckout("changed submission"), requestId);
  const submitted = useCartStore.getState().items;
  useCartStore.getState().addItem(product, values);
  useCartStore.getState().addItem({ ...product, id: "other" }, values);
  useCartStore.getState().removeSubmittedItems(submitted);
  assert.notEqual(useCartStore.getState().prepareCheckout("same submission"), requestId);
  assert.equal(useCartStore.getState().items.length, 2);
  assert.equal(useCartStore.getState().items[0].quantity, 1);
  const before = useCartStore.getState().items;
  const beforeRequest = useCartStore.getState().checkoutRequest;
  failWrites = true;
  assert.throws(() => useCartStore.getState().removeSubmittedItems(before), /Storage unavailable/);
  assert.deepEqual(useCartStore.getState().items, before);
  assert.deepEqual(useCartStore.getState().checkoutRequest, beforeRequest);
  assert.throws(() => useCartStore.getState().removeItem(before[0]), /Storage unavailable/);
  assert.deepEqual(useCartStore.getState().items, before);
  failWrites = false;
  useCartStore.getState().removeItem(before[0]);
  assert.equal(useCartStore.getState().items[0].productId, "other");
});

test("order endpoint handles malformed submissions and returns saved order references", async () => {
  const service = database();
  const { POST } = load("app/api/v1/orders/route.ts", {
    "@/lib/server/orders": { ...service, registerOrders: input => service.registerOrders(input, "2026-10-27") },
  });
  const malformed = await POST(new Request("http://localhost/api/v1/orders", { method: "POST", body: "{" }));
  assert.equal(malformed.status, 400);
  const invalid = await POST(new Request("http://localhost/api/v1/orders", { method: "POST", body: JSON.stringify({ ...request, lineId: " " }) }));
  assert.equal(invalid.status, 400);
  assert.equal(service.saved.size, 0);
  const response = await POST(new Request("http://localhost/api/v1/orders", { method: "POST", body: JSON.stringify(request) }));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.orders.length, 3);
});

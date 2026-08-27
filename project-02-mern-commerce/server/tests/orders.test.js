/**
 * Critical flows 5-6: the server prices the order, and a user can read only
 * their own.
 *
 * These are the two rules the whole checkout depends on, so the assertions are
 * deliberately hostile: the client sends prices, totals, statuses and someone
 * else's user id, and none of it may have any effect.
 */
import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import {
  app,
  Order,
  Product,
  createAdmin,
  loginAs,
  registerUser,
  seedCatalogue,
  setupDatabase,
  teardownDatabase,
} from "./helpers.js";

const PRICE = 25;
const STOCK = 10;
const SHIPPING = 6.9; // flat fee below the free-shipping threshold

const ADDRESS = {
  fullName: "Kupac Testni",
  phone: "+387 65 000 000",
  street: "Ulica 1",
  city: "Zvornik",
  postalCode: "75400",
  country: "Bosna i Hercegovina",
};

let buyerCookie;
let buyerId;
let otherCookie;
let adminCookie;
let product;

before(async () => {
  await setupDatabase();
  ({ product } = await seedCatalogue({ price: PRICE, stock: STOCK }));

  const buyer = await registerUser(request, { name: "Kupac Jedan", email: "buyer@test.local" });
  buyerCookie = buyer.cookie;
  buyerId = buyer.user.id;

  const other = await registerUser(request, { name: "Kupac Dva", email: "other@test.local" });
  otherCookie = other.cookie;

  const admin = await createAdmin();
  ({ cookie: adminCookie } = await loginAs(request, admin));
});

after(teardownDatabase);

describe("order creation: the server is the only authority on price", () => {
  test("checkout requires a session", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({
        items: [{ product: product.id, quantity: 1 }],
        shippingAddress: ADDRESS,
        paymentMethod: "cash_on_delivery",
      });

    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, "UNAUTHORIZED");
  });

  test("totals are recomputed from the database, not taken from the client", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({
        items: [
          {
            product: product.id,
            quantity: 2,
            // Everything below is a lie the client is not allowed to tell.
            unitPrice: 0.01,
            lineTotal: 0.02,
            name: "Free Stuff",
            sku: "FAKE-SKU",
          },
        ],
        shippingAddress: ADDRESS,
        paymentMethod: "cash_on_delivery",
        subtotal: 0.02,
        shippingCost: 0,
        total: 0.02,
        paymentStatus: "paid_demo",
        orderStatus: "delivered",
      });

    assert.equal(response.status, 201);
    const order = response.body.data.order;

    assert.equal(order.items[0].unitPrice, PRICE, "the unit price comes from the product");
    assert.equal(order.items[0].lineTotal, PRICE * 2);
    assert.equal(order.subtotal, PRICE * 2);
    assert.equal(order.shippingCost, SHIPPING);
    assert.equal(order.total, PRICE * 2 + SHIPPING);

    assert.equal(order.items[0].name, "Test Product", "the name snapshot comes from the product");
    assert.equal(order.items[0].sku, "TEST-SKU-1");

    assert.equal(order.orderStatus, "pending", "a client-sent status is ignored");
    assert.equal(order.paymentStatus, "pending");
  });

  test("stock is reduced by the ordered quantity", async () => {
    const stored = await Product.findById(product.id).lean();
    assert.equal(stored.stock, STOCK - 2);
  });

  test("a user id sent in the body cannot reassign ownership", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({
        items: [{ product: product.id, quantity: 1 }],
        shippingAddress: ADDRESS,
        paymentMethod: "cash_on_delivery",
        user: "000000000000000000000000",
      });

    assert.equal(response.status, 201);
    const stored = await Order.findById(response.body.data.order.id).lean();
    assert.equal(stored.user.toString(), buyerId, "the owner is the session, not the body");
  });

  test("an empty item list is rejected", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({ items: [], shippingAddress: ADDRESS, paymentMethod: "cash_on_delivery" });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  test("ordering more than the stock is refused and takes nothing", async () => {
    const before = (await Product.findById(product.id).lean()).stock;

    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({
        items: [{ product: product.id, quantity: before + 50 }],
        shippingAddress: ADDRESS,
        paymentMethod: "cash_on_delivery",
      });

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "OUT_OF_STOCK");

    const after = (await Product.findById(product.id).lean()).stock;
    assert.equal(after, before, "a refused order must not move stock");
  });

  test("stock can never be driven negative", async () => {
    const remaining = (await Product.findById(product.id).lean()).stock;

    // Take everything, then try to take one more.
    const drain = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({
        items: [{ product: product.id, quantity: remaining }],
        shippingAddress: ADDRESS,
        paymentMethod: "cash_on_delivery",
      });
    assert.equal(drain.status, 201);
    assert.equal((await Product.findById(product.id).lean()).stock, 0);

    const overdraw = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({
        items: [{ product: product.id, quantity: 1 }],
        shippingAddress: ADDRESS,
        paymentMethod: "cash_on_delivery",
      });
    assert.equal(overdraw.status, 409);
    assert.equal((await Product.findById(product.id).lean()).stock, 0, "never below zero");

    // Restore stock for the ownership tests below.
    await Product.updateOne({ _id: product.id }, { $set: { stock: STOCK } });
  });

  test("a nonexistent product is a 404", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({
        items: [{ product: "000000000000000000000000", quantity: 1 }],
        shippingAddress: ADDRESS,
        paymentMethod: "cash_on_delivery",
      });

    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, "NOT_FOUND");
  });

  test("an inactive product is refused and takes no stock", async () => {
    const before = (await Product.findById(product.id).lean()).stock;
    await Product.updateOne({ _id: product.id }, { $set: { active: false } });

    try {
      const response = await request(app)
        .post("/api/orders")
        .set("Cookie", buyerCookie)
        .send({
          items: [{ product: product.id, quantity: 1 }],
          shippingAddress: ADDRESS,
          paymentMethod: "cash_on_delivery",
        });

      // A cart line that is no longer purchasable is a request-validation
      // problem, and the response names which item it was.
      assert.equal(response.status, 400);
      assert.equal(response.body.error.code, "VALIDATION_ERROR");
      assert.ok(response.body.error.details.some((d) => d.field === "items"));
      assert.equal((await Product.findById(product.id).lean()).stock, before);
    } finally {
      // Restore regardless of the outcome, so a failure here cannot cascade
      // into every later test in the file.
      await Product.updateOne({ _id: product.id }, { $set: { active: true } });
    }
  });

  test("an incomplete shipping address is rejected", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({
        items: [{ product: product.id, quantity: 1 }],
        shippingAddress: { fullName: "Samo Ime" },
        paymentMethod: "cash_on_delivery",
      });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  test("an unknown payment method is rejected", async () => {
    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({
        items: [{ product: product.id, quantity: 1 }],
        shippingAddress: ADDRESS,
        paymentMethod: "bitcoin",
      });

    assert.equal(response.status, 400);
  });
});

describe("order ownership", () => {
  let buyerOrderId;

  before(async () => {
    const created = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({
        items: [{ product: product.id, quantity: 1 }],
        shippingAddress: ADDRESS,
        paymentMethod: "card_demo",
      });
    buyerOrderId = created.body.data.order.id;
  });

  test("/orders/mine returns only the caller's orders", async () => {
    const mine = await request(app).get("/api/orders/mine").set("Cookie", buyerCookie);
    const theirs = await request(app).get("/api/orders/mine").set("Cookie", otherCookie);

    assert.equal(mine.status, 200);
    assert.ok(mine.body.data.orders.length > 0);
    assert.equal(theirs.body.data.orders.length, 0, "the other user has placed nothing");
  });

  test("a user cannot read another user's order", async () => {
    const response = await request(app)
      .get(`/api/orders/${buyerOrderId}`)
      .set("Cookie", otherCookie);

    assert.ok(
      [403, 404].includes(response.status),
      `expected 403 or 404, received ${response.status}`,
    );
    assert.ok(!JSON.stringify(response.body).includes("Kupac Testni"), "no data may leak");
  });

  test("the owner can read their own order", async () => {
    const response = await request(app)
      .get(`/api/orders/${buyerOrderId}`)
      .set("Cookie", buyerCookie);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.order.id, buyerOrderId);
  });

  test("an admin can read any order", async () => {
    const response = await request(app)
      .get(`/api/orders/${buyerOrderId}`)
      .set("Cookie", adminCookie);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.order.id, buyerOrderId);
  });

  test("an anonymous request cannot read an order", async () => {
    const response = await request(app).get(`/api/orders/${buyerOrderId}`);
    assert.equal(response.status, 401);
  });

  test("a malformed order id is a controlled 400", async () => {
    const response = await request(app).get("/api/orders/not-an-id").set("Cookie", buyerCookie);

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });

  test("order snapshots survive a product change", async () => {
    await Product.updateOne(
      { _id: product.id },
      { $set: { name: "Preimenovani Proizvod", price: 999 } },
    );

    const response = await request(app)
      .get(`/api/orders/${buyerOrderId}`)
      .set("Cookie", buyerCookie);

    assert.equal(response.body.data.order.items[0].name, "Test Product");
    assert.equal(response.body.data.order.items[0].unitPrice, PRICE);

    await Product.updateOne({ _id: product.id }, { $set: { name: "Test Product", price: PRICE } });
  });
});

describe("admin order management", () => {
  let orderId;

  before(async () => {
    const created = await request(app)
      .post("/api/orders")
      .set("Cookie", buyerCookie)
      .send({
        items: [{ product: product.id, quantity: 1 }],
        shippingAddress: ADDRESS,
        paymentMethod: "cash_on_delivery",
      });
    orderId = created.body.data.order.id;
  });

  test("admin stats agree with the database", async () => {
    const response = await request(app).get("/api/admin/stats").set("Cookie", adminCookie);
    const stats = response.body.data.stats;

    assert.equal(stats.orders.total, await Order.countDocuments());
    assert.equal(stats.products.total, await Product.countDocuments());

    const notCancelled = await Order.find({ orderStatus: { $ne: "cancelled" } }).lean();
    const expected =
      Math.round(notCancelled.reduce((sum, order) => sum + order.total, 0) * 100) / 100;
    assert.equal(stats.demoRevenue, expected);
  });

  test("a legal status transition is applied", async () => {
    const response = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Cookie", adminCookie)
      .send({ orderStatus: "processing" });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.order.orderStatus, "processing");
  });

  test("only the status changes: totals, items and owner are untouched", async () => {
    const before = await Order.findById(orderId).lean();

    await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Cookie", adminCookie)
      .send({
        orderStatus: "shipped",
        total: 0.01,
        subtotal: 0.01,
        paymentStatus: "paid_demo",
        user: "000000000000000000000000",
        items: [],
      });

    const after = await Order.findById(orderId).lean();
    assert.equal(after.orderStatus, "shipped");
    assert.equal(after.total, before.total);
    assert.equal(after.subtotal, before.subtotal);
    assert.equal(after.paymentStatus, before.paymentStatus);
    assert.equal(after.items.length, before.items.length);
    assert.equal(after.user.toString(), before.user.toString());
  });

  test("an illegal transition is refused", async () => {
    await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Cookie", adminCookie)
      .send({ orderStatus: "delivered" });

    const backwards = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Cookie", adminCookie)
      .send({ orderStatus: "pending" });

    assert.equal(backwards.status, 400);
    assert.equal(backwards.body.error.code, "VALIDATION_ERROR");
    assert.equal((await Order.findById(orderId).lean()).orderStatus, "delivered");
  });

  test("an invalid status value is refused", async () => {
    const response = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set("Cookie", adminCookie)
      .send({ orderStatus: "teleported" });

    assert.equal(response.status, 400);
  });

  test("the admin order list carries no password hashes", async () => {
    const response = await request(app).get("/api/admin/orders").set("Cookie", adminCookie);

    assert.equal(response.status, 200);
    const body = JSON.stringify(response.body);
    assert.ok(!body.includes("passwordHash"));
    assert.ok(!body.includes("$2b$"));
  });
});

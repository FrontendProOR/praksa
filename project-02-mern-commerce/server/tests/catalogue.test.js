/**
 * Critical flows 2-4: admin authorization, catalogue pagination metadata and
 * the admin product CRUD happy path.
 */
import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import {
  app,
  Category,
  Product,
  createAdmin,
  loginAs,
  registerUser,
  setupDatabase,
  teardownDatabase,
} from "./helpers.js";

let adminCookie;
let userCookie;
let categoryId;

before(async () => {
  await setupDatabase();

  const admin = await createAdmin();
  ({ cookie: adminCookie } = await loginAs(request, admin));

  ({ cookie: userCookie } = await registerUser(request, {
    name: "Obična Korisnica",
    email: "user@test.local",
  }));

  const category = await Category.create({ name: "Reagensi", description: "Demo" });
  categoryId = category._id.toString();

  // 15 products: enough for three pages at the default limit of 12... and to
  // check that the metadata is computed rather than guessed.
  const products = Array.from({ length: 15 }, (_, index) => ({
    name: `Demo Proizvod ${index + 1}`,
    sku: `DEMO-${String(index + 1).padStart(3, "0")}`,
    shortDescription: `Kratak opis proizvoda ${index + 1}.`,
    description: `Puni opis fiktivnog demo proizvoda ${index + 1}.`,
    category: category._id,
    price: (index + 1) * 10,
    stock: 5,
    imageUrl: "/images/product-placeholder.svg",
    active: index !== 0, // the first one is inactive
    tags: index % 2 === 0 ? ["parni"] : ["neparni"],
  }));
  await Product.insertMany(products);
});

after(teardownDatabase);

describe("authorization: admin routes reject ordinary users", () => {
  const adminEndpoints = [
    ["get", "/api/admin/stats"],
    ["get", "/api/admin/products"],
    ["get", "/api/admin/orders"],
  ];

  for (const [method, path] of adminEndpoints) {
    test(`${method.toUpperCase()} ${path} is 401 anonymously and 403 as a user`, async () => {
      const anonymous = await request(app)[method](path);
      assert.equal(anonymous.status, 401);
      assert.equal(anonymous.body.error.code, "UNAUTHORIZED");

      const asUser = await request(app)[method](path).set("Cookie", userCookie);
      assert.equal(asUser.status, 403);
      assert.equal(asUser.body.error.code, "FORBIDDEN");

      const asAdmin = await request(app)[method](path).set("Cookie", adminCookie);
      assert.equal(asAdmin.status, 200);
    });
  }

  test("product and category mutations are admin-only", async () => {
    const createProduct = await request(app)
      .post("/api/products")
      .set("Cookie", userCookie)
      .send({ name: "Nope" });
    assert.equal(createProduct.status, 403);

    const createCategory = await request(app)
      .post("/api/categories")
      .set("Cookie", userCookie)
      .send({ name: "Nope" });
    assert.equal(createCategory.status, 403);
  });

  test("a role claimed by the client does not grant admin", async () => {
    const viaHeader = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", userCookie)
      .set("x-user-role", "admin");
    assert.equal(viaHeader.status, 403);

    const viaQuery = await request(app)
      .get("/api/admin/stats?role=admin")
      .set("Cookie", userCookie);
    assert.equal(viaQuery.status, 403);

    const viaBody = await request(app)
      .post("/api/products")
      .set("Cookie", userCookie)
      .send({ name: "Nope", role: "admin", user: { role: "admin" } });
    assert.equal(viaBody.status, 403);
  });
});

describe("catalogue: listing, pagination metadata and public rules", () => {
  test("the default listing returns pagination metadata that matches", async () => {
    const response = await request(app).get("/api/products");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.meta, {
      page: 1,
      limit: 12,
      totalItems: 14, // 15 seeded, 1 inactive
      totalPages: 2,
    });
    assert.equal(response.body.data.products.length, 12);
  });

  test("the public listing hides inactive products, the admin listing shows them", async () => {
    const publicList = await request(app).get("/api/products?limit=48");
    const adminList = await request(app).get("/api/admin/products?limit=48").set("Cookie", adminCookie);

    assert.equal(publicList.body.meta.totalItems, 14);
    assert.equal(adminList.body.meta.totalItems, 15);
    assert.ok(publicList.body.data.products.every((p) => p.active !== false));
    assert.ok(adminList.body.data.products.some((p) => p.active === false));
  });

  test("the second page holds the remainder", async () => {
    const response = await request(app).get("/api/products?page=2");

    assert.equal(response.body.meta.page, 2);
    assert.equal(response.body.data.products.length, 2);
  });

  test("sorting by price works in both directions", async () => {
    const ascending = await request(app).get("/api/products?sort=price_asc&limit=48");
    const descending = await request(app).get("/api/products?sort=price_desc&limit=48");

    const ascPrices = ascending.body.data.products.map((p) => p.price);
    const descPrices = descending.body.data.products.map((p) => p.price);

    assert.deepEqual(ascPrices, [...ascPrices].sort((a, b) => a - b));
    assert.deepEqual(descPrices, [...descPrices].sort((a, b) => b - a));
  });

  test("search is case-insensitive and narrows the result set", async () => {
    const response = await request(app).get("/api/products?q=DEMO+PROIZVOD+7");

    assert.ok(response.body.meta.totalItems >= 1);
    assert.ok(response.body.data.products.some((p) => p.name === "Demo Proizvod 7"));
  });

  test("invalid page, limit and sort values cannot crash the API", async () => {
    for (const query of [
      "page=0",
      "page=-5",
      "page=abc",
      "limit=0",
      "limit=9999",
      "limit=abc",
      "sort=; drop everything",
      "page[]=1",
    ]) {
      const response = await request(app).get(`/api/products?${query}`);
      assert.ok(
        response.status === 200 || response.status === 400,
        `${query} produced HTTP ${response.status}`,
      );
      if (response.status === 200) {
        assert.ok(response.body.meta.page >= 1);
        assert.ok(response.body.meta.limit >= 1 && response.body.meta.limit <= 48);
      }
    }
  });

  test("a product is readable by slug, and a missing one is a 404", async () => {
    const list = await request(app).get("/api/products");
    const { slug } = list.body.data.products[0];

    const found = await request(app).get(`/api/products/${slug}`);
    assert.equal(found.status, 200);
    assert.equal(found.body.data.product.slug, slug);

    const missing = await request(app).get("/api/products/ne-postoji-ovaj-proizvod");
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error.code, "NOT_FOUND");
  });
});

describe("product CRUD: the admin happy path", () => {
  let createdId;

  test("an admin can create a product", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Cookie", adminCookie)
      .send({
        name: "Novi Demo Proizvod",
        sku: "novi-001",
        shortDescription: "Kratak opis novog proizvoda.",
        description: "Puni opis novog fiktivnog demo proizvoda.",
        category: categoryId,
        price: 49.9,
        compareAtPrice: 59.9,
        stock: 4,
        imageUrl: "/images/product-placeholder.svg",
        tags: ["novo"],
      });

    assert.equal(response.status, 201);
    const product = response.body.data.product;
    createdId = product.id;

    assert.equal(product.sku, "NOVI-001", "the SKU is normalised to upper case");
    assert.equal(product.slug, "novi-demo-proizvod", "the slug is generated on the server");
    assert.equal(product.price, 49.9);
    assert.equal(product.active, true);
  });

  test("a duplicate SKU is a 409 that names the field", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Cookie", adminCookie)
      .send({
        name: "Drugi Proizvod",
        sku: "NOVI-001",
        shortDescription: "Kratak opis.",
        description: "Puni opis.",
        category: categoryId,
        price: 10,
        stock: 1,
        imageUrl: "/images/product-placeholder.svg",
      });

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "CONFLICT");
    assert.ok(response.body.error.details.some((d) => d.field === "sku"));
  });

  test("an admin can update a product", async () => {
    const response = await request(app)
      .put(`/api/products/${createdId}`)
      .set("Cookie", adminCookie)
      .send({
        name: "Izmijenjeni Demo Proizvod",
        sku: "NOVI-001",
        shortDescription: "Izmijenjen kratak opis.",
        description: "Izmijenjen puni opis.",
        category: categoryId,
        price: 39.9,
        stock: 9,
        imageUrl: "/images/product-placeholder.svg",
        featured: true,
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.product.price, 39.9);
    assert.equal(response.body.data.product.stock, 9);
    assert.equal(response.body.data.product.featured, true);
  });

  test("invalid values are rejected with field-level details", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Cookie", adminCookie)
      .send({
        name: "",
        sku: "",
        shortDescription: "",
        description: "",
        category: "not-an-object-id",
        price: -5,
        compareAtPrice: 1, // below the price
        stock: 2.5, // not an integer
        imageUrl: "",
      });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");

    const fields = new Set(response.body.error.details.map((d) => d.field));
    for (const field of ["name", "sku", "shortDescription", "description", "category", "price", "stock", "imageUrl"]) {
      assert.ok(fields.has(field), `expected a detail for "${field}"`);
    }
  });

  test("a malformed id is a controlled 400, never a crash", async () => {
    const response = await request(app)
      .put("/api/products/not-a-valid-id")
      .set("Cookie", adminCookie)
      .send({ name: "x" });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
    assert.ok(!JSON.stringify(response.body).includes("at "), "no stack trace may leak");
  });

  test("an admin can delete a product", async () => {
    const response = await request(app)
      .delete(`/api/products/${createdId}`)
      .set("Cookie", adminCookie);

    assert.equal(response.status, 200);
    assert.equal(await Product.countDocuments({ _id: createdId }), 0);
  });
});

describe("category CRUD and the in-use conflict", () => {
  test("a category still used by active products cannot be deleted", async () => {
    const response = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Cookie", adminCookie);

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "CONFLICT");
    assert.equal(await Category.countDocuments({ _id: categoryId }), 1);
  });

  test("an unused category is created, updated and deleted", async () => {
    const created = await request(app)
      .post("/api/categories")
      .set("Cookie", adminCookie)
      .send({ name: "Privremena Kategorija", description: "Bez proizvoda" });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.category.slug, "privremena-kategorija");

    const id = created.body.data.category.id;

    const updated = await request(app)
      .put(`/api/categories/${id}`)
      .set("Cookie", adminCookie)
      .send({ name: "Privremena Kategorija", description: "Izmijenjen opis" });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.category.description, "Izmijenjen opis");

    const deleted = await request(app)
      .delete(`/api/categories/${id}`)
      .set("Cookie", adminCookie);
    assert.equal(deleted.status, 200);
  });

  test("a duplicate category name is a 409", async () => {
    const response = await request(app)
      .post("/api/categories")
      .set("Cookie", adminCookie)
      .send({ name: "Reagensi" });

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "CONFLICT");
  });
});

describe("error envelope and unknown routes", () => {
  test("an unknown API route returns the standard 404 envelope", async () => {
    const response = await request(app).get("/api/ne-postoji");

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, "NOT_FOUND");
    assert.deepEqual(Object.keys(response.body.error).sort(), ["code", "details", "message"]);
  });

  test("malformed JSON is handled, not crashed on", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": "broken", ');

    assert.ok(response.status === 400 || response.status === 500);
    assert.equal(response.body.success, false);
    assert.ok(!JSON.stringify(response.body).includes("SyntaxError"));
  });

  test("an oversized body is refused by the configured limit", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "x".repeat(200 * 1024), email: "big@test.local", password: "StrongPass123" });

    assert.ok(response.status >= 400, `expected a 4xx/5xx, received ${response.status}`);
    assert.equal(response.body.success, false);
  });

  test("the health endpoint reports status without leaking configuration", async () => {
    const response = await request(app).get("/api/health");

    assert.equal(response.status, 200);
    const body = JSON.stringify(response.body);
    assert.ok(!body.includes("JWT"));
    assert.ok(!body.includes("mongodb://"));
  });
});

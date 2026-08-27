/**
 * Shared setup for the backend test suite.
 *
 * The tests run against a real MongoDB, but in their own database
 * (`smweb_mern_commerce_test`), so development data is never touched. The
 * database name is forced here, before any application module is imported,
 * because `config/env.js` reads the environment once at import time and
 * `dotenv` does not overwrite variables that are already set.
 *
 * `NODE_ENV=test` also switches off both rate limiters, so a suite that makes
 * deliberate failed-login attempts is not throttled. The limiters themselves
 * are verified separately, by a check that enables them explicitly.
 */
process.env.NODE_ENV = "test";
process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI ?? "mongodb://127.0.0.1:27017/smweb_mern_commerce_test";
// A test-only signing key: long enough to satisfy the startup check, and never
// the development or production secret.
process.env.JWT_SECRET =
  process.env.TEST_JWT_SECRET ?? "test_only_secret_value_not_used_anywhere_else_0123456789";

const { connectDatabase, disconnectDatabase } = await import("../src/config/db.js");
const { createApp } = await import("../src/app.js");
const { default: User } = await import("../src/models/User.js");
const { default: Category } = await import("../src/models/Category.js");
const { default: Product } = await import("../src/models/Product.js");
const { default: Order } = await import("../src/models/Order.js");
const { hashPassword } = await import("../src/utils/password.js");

export { User, Category, Product, Order };
export const app = createApp();

/** Opens the connection and clears every collection this suite uses. */
export async function setupDatabase() {
  await connectDatabase(process.env.MONGODB_URI);
  await resetDatabase();
}

export async function resetDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
  ]);
}

export async function teardownDatabase() {
  await resetDatabase();
  await disconnectDatabase();
}

/**
 * Creates an admin directly, the way the seed script does. There is no API
 * route that grants the role, which is exactly what the tests rely on.
 */
export async function createAdmin({ email = "admin@test.local", password = "AdminPass123" } = {}) {
  const passwordHash = await hashPassword(password);
  const user = await User.create({ name: "Test Admin", email, passwordHash, role: "admin" });
  return { user, email, password };
}

/** Pulls the `access_token` cookie out of a response, ready to send back. */
export function sessionCookie(response) {
  const raw = response.headers["set-cookie"] ?? [];
  const token = raw.find((cookie) => cookie.startsWith("access_token="));
  return token ? token.split(";")[0] : null;
}

/** Registers a normal user through the public endpoint and returns its cookie. */
export async function registerUser(request, { name, email, password = "UserPass123" }) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password });
  return { response, cookie: sessionCookie(response), user: response.body.data?.user };
}

export async function loginAs(request, { email, password }) {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  return { response, cookie: sessionCookie(response) };
}

/** A category and a product to order, with a known price and stock. */
export async function seedCatalogue({ price = 25, stock = 10 } = {}) {
  const category = await Category.create({ name: "Test Category", description: "For tests" });
  const product = await Product.create({
    name: "Test Product",
    sku: "TEST-SKU-1",
    shortDescription: "A fictional demo product used by the test suite.",
    description: "A fictional demo product used by the test suite.",
    category: category._id,
    price,
    stock,
    imageUrl: "/images/product-placeholder.svg",
  });
  return { category, product };
}

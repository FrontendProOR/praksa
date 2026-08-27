/**
 * Critical flow 1: registration, login and the authenticated identity.
 *
 * Section 12 of CLAUDE.md names this as a flow that must be automated. The
 * assertions here are the security-relevant ones - what is stored, what is
 * returned and what a client is allowed to decide - not just the status code.
 */
import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app, User, setupDatabase, teardownDatabase, sessionCookie } from "./helpers.js";

before(setupDatabase);
after(teardownDatabase);

describe("auth: register, login, me", () => {
  const credentials = { name: "Ana Anić", email: "ana@test.local", password: "StrongPass123" };

  test("registration creates a user and opens a session", async () => {
    const response = await request(app).post("/api/auth/register").send(credentials);

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.user.email, "ana@test.local");
    assert.equal(response.body.data.user.role, "user");

    const cookie = sessionCookie(response);
    assert.ok(cookie, "an access_token cookie must be set");

    const rawCookie = response.headers["set-cookie"].find((c) => c.startsWith("access_token="));
    assert.match(rawCookie, /HttpOnly/i, "the session cookie must be HttpOnly");
    assert.match(rawCookie, /SameSite=Lax/i);
    assert.ok(!/Secure/i.test(rawCookie), "Secure is only set in production");
  });

  test("the password is stored only as a bcrypt hash", async () => {
    const stored = await User.findOne({ email: credentials.email }).select("+passwordHash").lean();

    assert.ok(stored.passwordHash, "a hash must be stored");
    assert.notEqual(stored.passwordHash, credentials.password);
    assert.match(stored.passwordHash, /^\$2[aby]\$/, "must be a bcrypt hash");
    assert.equal(stored.password, undefined, "no plaintext password field may exist");
  });

  test("no response ever contains the password hash", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: credentials.email,
      password: credentials.password,
    });

    assert.equal(response.status, 200);
    assert.ok(!JSON.stringify(response.body).includes("passwordHash"));
    assert.ok(!JSON.stringify(response.body).includes("$2b$"));
  });

  test("a duplicate email is a 409 conflict", async () => {
    const response = await request(app).post("/api/auth/register").send(credentials);

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "CONFLICT");
  });

  test("registration cannot grant the admin role", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Sneaky User",
      email: "sneaky@test.local",
      password: "StrongPass123",
      role: "admin",
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.user.role, "user");

    const stored = await User.findOne({ email: "sneaky@test.local" }).lean();
    assert.equal(stored.role, "user", "the database must not hold the claimed role either");
  });

  test("invalid credentials give a generic 401", async () => {
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "WrongPass123" });
    const noSuchUser = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.local", password: "WrongPass123" });

    assert.equal(wrongPassword.status, 401);
    assert.equal(noSuchUser.status, 401);
    assert.equal(
      wrongPassword.body.error.message,
      noSuchUser.body.error.message,
      "the message must not reveal whether the account exists",
    );
  });

  test("/auth/me is 401 without a session and 200 with one", async () => {
    const anonymous = await request(app).get("/api/auth/me");
    assert.equal(anonymous.status, 401);
    assert.equal(anonymous.body.error.code, "UNAUTHORIZED");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    const me = await request(app).get("/api/auth/me").set("Cookie", sessionCookie(login));
    assert.equal(me.status, 200);
    assert.deepEqual(Object.keys(me.body.data.user).sort(), [
      "createdAt",
      "email",
      "id",
      "name",
      "role",
    ]);
  });

  test("a forged or tampered token is rejected", async () => {
    const forged = await request(app).get("/api/auth/me").set("Cookie", "access_token=not.a.jwt");
    assert.equal(forged.status, 401);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    const valid = sessionCookie(login).split("=")[1];
    const tampered = `${valid.slice(0, -3)}xyz`;

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `access_token=${tampered}`);
    assert.equal(response.status, 401);
  });

  test("a token for a deleted user is rejected", async () => {
    const registration = await request(app).post("/api/auth/register").send({
      name: "Temporary User",
      email: "temp@test.local",
      password: "StrongPass123",
    });
    const cookie = sessionCookie(registration);

    assert.equal((await request(app).get("/api/auth/me").set("Cookie", cookie)).status, 200);

    await User.deleteOne({ email: "temp@test.local" });

    const afterDelete = await request(app).get("/api/auth/me").set("Cookie", cookie);
    assert.equal(afterDelete.status, 401, "the account is gone, so the token must not work");
  });

  test("logout clears the cookie", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    const response = await request(app).post("/api/auth/logout").set("Cookie", sessionCookie(login));
    assert.equal(response.status, 200);

    const cleared = response.headers["set-cookie"].find((c) => c.startsWith("access_token="));
    assert.match(cleared, /access_token=;/, "the cookie value must be emptied");
  });
});

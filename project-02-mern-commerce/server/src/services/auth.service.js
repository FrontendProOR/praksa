import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";

/**
 * Authentication business rules.
 *
 * Nothing here touches `req`/`res`; the controller turns these results into
 * HTTP responses and cookies.
 */

/**
 * Registers a new account.
 *
 * The payload is passed through `User.fromRegistration`, which whitelists
 * `name`, `email` and `passwordHash` and forces `role: "user"` - so a request
 * body carrying `role: "admin"` cannot escalate. Admin accounts are created by
 * the documented development script instead.
 *
 * @param {{ name: string, email: string, password: string }} payload
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function registerUser({ name, email, password }) {
  const normalisedEmail = String(email).trim().toLowerCase();

  const existing = await User.exists({ email: normalisedEmail });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists", [
      { field: "email", message: "Email is already registered" },
    ]);
  }

  const passwordHash = await hashPassword(password);
  const user = User.fromRegistration({ name, email: normalisedEmail, passwordHash });

  await user.save();

  return { user, token: signAccessToken({ id: user.id, role: user.role }) };
}

/**
 * Verifies credentials and issues a token.
 *
 * `passwordHash` is hidden by the schema, so it is selected explicitly here
 * and nowhere else. Both an unknown email and a wrong password produce the
 * same generic 401, so the endpoint cannot be used to discover which addresses
 * are registered.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginUser({ email, password }) {
  const normalisedEmail = String(email).trim().toLowerCase();
  const invalidCredentials = ApiError.unauthorized("Invalid email or password");

  const user = await User.findOne({ email: normalisedEmail }).select("+passwordHash");
  if (!user) {
    // Hash a throwaway value so a missing account takes about as long as a
    // wrong password, instead of returning noticeably faster.
    await verifyPassword(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    throw invalidCredentials;
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) throw invalidCredentials;

  return { user, token: signAccessToken({ id: user.id, role: user.role }) };
}

/**
 * Loads the account behind an authenticated request.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 * @throws {ApiError} 401 when the account no longer exists
 */
export async function getAuthenticatedUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized("Session is no longer valid");
  return user;
}

/** The only user fields the API ever returns. */
export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

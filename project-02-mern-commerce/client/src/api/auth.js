import { apiClient, unwrap } from "./client.js";

/**
 * Authentication endpoints.
 *
 * The session token never appears here: the API sets it as an HttpOnly cookie,
 * the browser sends it automatically because the shared Axios instance uses
 * `withCredentials: true`, and JavaScript can neither read nor store it. These
 * functions only ever return the safe user object.
 */

/**
 * Creates an account. The API always assigns the `user` role - a `role` field
 * is never sent, and would be ignored by the server if it were.
 *
 * @param {{ name: string, email: string, password: string }} payload
 * @returns {Promise<object>} the new user
 */
export async function registerAccount({ name, email, password }) {
  const response = await apiClient.post("/auth/register", { name, email, password });
  return unwrap(response).data.user;
}

/**
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<object>} the signed-in user
 */
export async function login({ email, password }) {
  const response = await apiClient.post("/auth/login", { email, password });
  return unwrap(response).data.user;
}

/** Clears the session cookie. Safe to call when no session exists. */
export async function logout() {
  await apiClient.post("/auth/logout");
}

/**
 * Reads the current session.
 *
 * @returns {Promise<object>} the signed-in user
 * @throws {import("./client.js").ApiRequestError} 401 when there is no session
 */
export async function fetchCurrentUser({ signal } = {}) {
  const response = await apiClient.get("/auth/me", { signal });
  return unwrap(response).data.user;
}

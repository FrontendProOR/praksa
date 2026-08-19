import * as authService from "../services/auth.service.js";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies.js";
import { sendCreated, sendOk } from "../utils/respond.js";

/**
 * Auth controllers.
 *
 * The token is only ever written into the HttpOnly cookie - it is never put in
 * a response body, so the client has nothing to store in localStorage.
 */

export async function register(req, res) {
  const { name, email, password } = req.body;
  const { user, token } = await authService.registerUser({ name, email, password });

  // A successful registration starts the session immediately.
  setAuthCookie(res, token);
  return sendCreated(res, { user: authService.toPublicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const { user, token } = await authService.loginUser({ email, password });

  setAuthCookie(res, token);
  return sendOk(res, { user: authService.toPublicUser(user) });
}

/** Idempotent: clearing a cookie that is not there is still a success. */
export function logout(req, res) {
  clearAuthCookie(res);
  return sendOk(res, { loggedOut: true });
}

export function me(req, res) {
  return sendOk(res, { user: authService.toPublicUser(req.user) });
}

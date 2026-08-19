import { isProduction } from "../config/env.js";

/**
 * Authentication cookie handling.
 *
 * The token lives in an HttpOnly cookie so browser JavaScript cannot read it,
 * and it is never returned in a response body for storage in localStorage.
 *
 * Set and clear share one options object: a cookie is only removed when the
 * clearing attributes match the ones it was created with.
 */

export const AUTH_COOKIE_NAME = "access_token";

/** Roughly the token lifetime (60 minutes). */
export const AUTH_COOKIE_MAX_AGE_MS = 60 * 60 * 1000;

function baseOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    // Only over HTTPS in production; a local http:// dev server must still work.
    secure: isProduction,
    path: "/",
  };
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...baseOptions(),
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  });
}

/** Safe to call when no session exists - clearing is idempotent. */
export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, baseOptions());
}

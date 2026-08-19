import { ApiError } from "../utils/ApiError.js";
import { AUTH_COOKIE_NAME } from "../utils/cookies.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { getAuthenticatedUser } from "../services/auth.service.js";

/**
 * Authentication and authorization middleware.
 *
 * The identity comes exclusively from the signed JWT in the HttpOnly cookie
 * and the user record it points at. Roles supplied in a request body, header
 * or query string are ignored entirely.
 */

/**
 * Verifies the session cookie and attaches the current user.
 *
 * Rejects with 401 when the cookie is absent, the token is malformed, the
 * signature does not verify, the token has expired, or the account behind it
 * no longer exists.
 */
export async function authenticate(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    return next(ApiError.unauthorized("Authentication is required"));
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    const message =
      error?.name === "TokenExpiredError"
        ? "Session has expired, please log in again"
        : "Invalid authentication token";
    return next(ApiError.unauthorized(message));
  }

  // The database is the authority on the role, not the token: a role changed
  // or an account deleted after the token was issued takes effect immediately.
  const user = await getAuthenticatedUser(payload.sub);

  req.user = user;
  req.auth = { userId: user.id, role: user.role };
  return next();
}

/**
 * Restricts a route to the given roles. Always used after `authenticate`.
 *
 * @param {...('user'|'admin')} roles
 */
export function authorize(...roles) {
  return function checkRole(req, res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication is required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden("You do not have permission to perform this action"),
      );
    }

    return next();
  };
}

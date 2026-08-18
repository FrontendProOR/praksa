import { ApiError } from "../utils/ApiError.js";

/**
 * TEMPORARY - remove on Day 08.
 *
 * Admin mutations (creating, updating and deleting products and categories)
 * are fully implemented in the controllers and services, but JWT
 * authentication and the `authorize('admin')` middleware do not exist yet.
 * Rather than exposing those routes unprotected, every one of them is closed
 * here and rejects with 401.
 *
 * This is a hard block: there is no header, query parameter or environment
 * flag that opens it. The services are exercised directly by the verification
 * suite, so the CRUD logic is testable without a bypass that would later
 * become a security hole.
 *
 * On Day 08 this middleware is replaced by `authenticate` + `authorize('admin')`
 * on the same routes.
 */
export function adminLock(req, res, next) {
  next(
    ApiError.unauthorized(
      "Admin authentication is not available yet. This endpoint is disabled " +
        "until JWT authentication and role authorization are implemented.",
    ),
  );
}

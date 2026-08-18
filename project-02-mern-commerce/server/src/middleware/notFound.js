import { ApiError } from "../utils/ApiError.js";

/**
 * Any request that reaches this point matched no route. Handing an ApiError to
 * the central error handler keeps unknown routes in the same JSON envelope as
 * every other failure.
 */
export function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

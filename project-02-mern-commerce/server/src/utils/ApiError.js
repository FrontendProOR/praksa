/**
 * Application error carrying the HTTP status and the API error code.
 *
 * Only the codes listed in the API contract may be used:
 * VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT,
 * OUT_OF_STOCK, INTERNAL_ERROR.
 */

export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  INTERNAL_ERROR: "INTERNAL_ERROR",
});

export class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status
   * @param {string} code one of ERROR_CODES
   * @param {string} message human readable, safe to show a client
   * @param {Array<object>} [details] per-field information
   */
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isApiError = true;
  }

  static validation(message = "Validation failed", details = []) {
    return new ApiError(400, ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  static unauthorized(message = "Authentication is required") {
    return new ApiError(401, ERROR_CODES.UNAUTHORIZED, message);
  }

  static forbidden(message = "You are not allowed to perform this action") {
    return new ApiError(403, ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, ERROR_CODES.NOT_FOUND, message);
  }

  static conflict(message = "Resource conflict", details = []) {
    return new ApiError(409, ERROR_CODES.CONFLICT, message, details);
  }

  static outOfStock(message = "Not enough stock", details = []) {
    return new ApiError(409, ERROR_CODES.OUT_OF_STOCK, message, details);
  }

  static internal(message = "Unexpected server error") {
    return new ApiError(500, ERROR_CODES.INTERNAL_ERROR, message);
  }
}

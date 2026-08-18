import mongoose from "mongoose";
import { ApiError, ERROR_CODES } from "../utils/ApiError.js";
import { isProduction, isTest } from "../config/env.js";

/**
 * Central error handler.
 *
 * Everything a client receives is built here, so no internal detail escapes:
 * no stack traces, no raw MongoDB error objects and no driver messages. The
 * original error is logged on the server instead.
 *
 * Translations:
 *   ApiError                    -> its own status/code/message/details
 *   Mongoose ValidationError    -> 400 VALIDATION_ERROR, one detail per field
 *   Mongoose CastError          -> 400 VALIDATION_ERROR (malformed id/value)
 *   MongoServerError 11000      -> 409 CONFLICT, naming the duplicated field
 *   anything else               -> 500 INTERNAL_ERROR with a generic message
 */

const DUPLICATE_KEY = 11000;

function translate(error) {
  if (error?.isApiError) return error;

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }));
    return ApiError.validation("Validation failed", details);
  }

  if (error instanceof mongoose.Error.CastError) {
    return ApiError.validation("Invalid value for a request parameter", [
      { field: error.path, message: `"${error.value}" is not a valid ${error.kind}` },
    ]);
  }

  if (error?.code === DUPLICATE_KEY) {
    const fields = Object.keys(error.keyValue ?? {});
    const details = fields.map((field) => ({
      field,
      message: `${field} must be unique`,
    }));
    const label = fields.length ? fields.join(", ") : "value";
    return ApiError.conflict(`Duplicate ${label}`, details);
  }

  return ApiError.internal();
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
export function errorHandler(error, req, res, next) {
  const apiError = translate(error);

  // 5xx means something unexpected happened: keep the original for the logs.
  if (apiError.statusCode >= 500 && !isTest) {
    console.error(`[${req.method} ${req.originalUrl}]`, error);
  }

  const message =
    apiError.statusCode >= 500 && isProduction
      ? "Unexpected server error"
      : apiError.message;

  return res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code ?? ERROR_CODES.INTERNAL_ERROR,
      message,
      details: apiError.details ?? [],
    },
  });
}

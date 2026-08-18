import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

/**
 * Turns express-validator failures into the standard VALIDATION_ERROR
 * response. Placed after the validation chains on every route that has them.
 */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((issue) => ({
    field: issue.path ?? issue.param,
    message: issue.msg,
  }));

  return next(ApiError.validation("Request validation failed", details));
}

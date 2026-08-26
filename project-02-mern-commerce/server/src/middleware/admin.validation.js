import { body, param, query } from "express-validator";
import { ORDER_STATUSES } from "../models/Order.js";

/** Validation for the admin endpoints. */

export const orderStatusFilter = [
  query("status")
    .optional()
    .isIn(ORDER_STATUSES)
    .withMessage(`Status must be one of: ${ORDER_STATUSES.join(", ")}`),
];

/**
 * The status change accepts exactly one field. Anything else in the body is
 * ignored by the controller, which reads only `orderStatus`.
 */
export const orderStatusBody = [
  param("id").isMongoId().withMessage("Invalid order id"),
  body("orderStatus")
    .isIn(ORDER_STATUSES)
    .withMessage(`Status must be one of: ${ORDER_STATUSES.join(", ")}`),
];

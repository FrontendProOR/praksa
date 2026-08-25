import { body, param } from "express-validator";
import { PAYMENT_METHODS } from "../models/Order.js";

/**
 * Validation for the order endpoints.
 *
 * Only product ids and quantities are accepted for the line items. Prices,
 * totals, statuses and the owning user are deliberately absent: the server
 * derives all of them, so there is nothing to validate and nothing a client
 * could usefully send.
 */

const addressField = (name, label, max = 120) =>
  body(`shippingAddress.${name}`)
    .isString()
    .withMessage(`${label} is required`)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .isLength({ max })
    .withMessage(`${label} must be at most ${max} characters`);

export const createOrderBody = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("An order must contain at least one item"),
  body("items.*.product").isMongoId().withMessage("Each item needs a valid product id"),
  body("items.*.quantity")
    .isInt({ min: 1, max: 999 })
    .withMessage("Quantity must be a whole number of at least 1")
    .toInt(),

  addressField("fullName", "Full name", 120),
  addressField("phone", "Phone", 40),
  addressField("street", "Street", 160),
  addressField("city", "City", 80),
  addressField("postalCode", "Postal code", 20),
  addressField("country", "Country", 80),

  body("paymentMethod")
    .isIn(PAYMENT_METHODS)
    .withMessage("Payment method must be cash_on_delivery or card_demo"),
];

export const orderIdParam = [param("id").isMongoId().withMessage("Invalid order id")];

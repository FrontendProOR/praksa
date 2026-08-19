import { body } from "express-validator";
import { PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from "../utils/password.js";

/**
 * Validation chains for the auth endpoints.
 *
 * `role` is intentionally not accepted anywhere: registration always produces
 * a `user`, and the model enforces that as well.
 */

export const registerBody = [
  body("name")
    .isString()
    .withMessage("Name is required")
    .bail()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("email")
    .isString()
    .withMessage("Email is required")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Email is not a valid address")
    .bail()
    .isLength({ max: 120 })
    .withMessage("Email must be at most 120 characters")
    .normalizeEmail({ gmail_remove_dots: false }),
  body("password")
    .isString()
    .withMessage("Password is required")
    .bail()
    .matches(PASSWORD_PATTERN)
    .withMessage(PASSWORD_RULE_MESSAGE),
];

export const loginBody = [
  body("email")
    .isString()
    .withMessage("Email is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required"),
  body("password")
    .isString()
    .withMessage("Password is required")
    .bail()
    .notEmpty()
    .withMessage("Password is required"),
];

import { body, param } from "express-validator";

/**
 * express-validator chains for the category endpoints.
 *
 * This is the first validation layer, at the API boundary. The Mongoose schema
 * repeats the same constraints as a second layer, so a service call that never
 * passes through HTTP is still protected.
 */

export const categorySlugParam = [
  param("slug")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Slug is required")
    .isLength({ max: 200 })
    .withMessage("Slug is too long"),
];

export const categoryIdParam = [
  param("id").isMongoId().withMessage("Invalid category id"),
];

export const categoryBody = [
  body("name")
    .isString()
    .withMessage("Name is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 120 })
    .withMessage("Name must be at most 120 characters"),
  body("slug")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Slug must be at most 200 characters"),
  body("description")
    .optional({ values: "null" })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must be at most 500 characters"),
  body("active")
    .optional()
    .isBoolean()
    .withMessage("Active must be true or false")
    .toBoolean(),
];

import { body, param } from "express-validator";

/** express-validator chains for the product endpoints. */

export const productSlugParam = [
  param("slug")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Slug is required")
    .isLength({ max: 200 })
    .withMessage("Slug is too long"),
];

export const productIdParam = [
  param("id").isMongoId().withMessage("Invalid product id"),
];

/**
 * Create and full update share this chain: PUT replaces the product, so it
 * requires the same fields as POST.
 */
export const productBody = [
  body("name")
    .isString()
    .withMessage("Name is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 160 })
    .withMessage("Name must be at most 160 characters"),
  body("slug")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Slug must be at most 200 characters"),
  body("sku")
    .isString()
    .withMessage("SKU is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("SKU is required")
    .isLength({ max: 60 })
    .withMessage("SKU must be at most 60 characters"),
  body("shortDescription")
    .isString()
    .withMessage("Short description is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Short description is required")
    .isLength({ max: 300 })
    .withMessage("Short description must be at most 300 characters"),
  body("description")
    .isString()
    .withMessage("Description is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 5000 })
    .withMessage("Description must be at most 5000 characters"),
  body("category").isMongoId().withMessage("A valid category id is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a number of 0 or more")
    .toFloat(),
  body("compareAtPrice")
    .optional({ values: "null" })
    .isFloat({ min: 0 })
    .withMessage("Compare-at price must be a number of 0 or more")
    .toFloat()
    .custom((value, { req }) => {
      if (value === undefined || value === null) return true;
      if (Number(value) < Number(req.body.price)) {
        throw new Error("Compare-at price must be greater than or equal to price");
      }
      return true;
    }),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a whole number of 0 or more")
    .toInt(),
  body("imageUrl")
    .isString()
    .withMessage("Image URL is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Image URL is required"),
  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be true or false")
    .toBoolean(),
  body("active")
    .optional()
    .isBoolean()
    .withMessage("Active must be true or false")
    .toBoolean(),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .isString()
    .withMessage("Every tag must be a string")
    .trim(),
];

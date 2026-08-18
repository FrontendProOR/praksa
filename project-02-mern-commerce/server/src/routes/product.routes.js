import { Router } from "express";
import * as controller from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.js";
import { adminLock } from "../middleware/adminLock.js";
import {
  productBody,
  productIdParam,
  productSlugParam,
} from "../middleware/product.validation.js";

/**
 * Product routes.
 *
 * Catalogue query parameters (q, category, sort, page, limit, featured) are
 * normalised in the service rather than rejected here: out-of-range values are
 * clamped to the documented bounds so a hand-edited URL cannot break the
 * listing.
 *
 * The three mutation routes are closed by `adminLock` until Day 08.
 */
const router = Router();

// Public
router.get("/", controller.listProducts);
router.get("/:slug", productSlugParam, validate, controller.getProductBySlug);

// Admin - disabled until authentication exists (Day 08)
router.post("/", adminLock, productBody, validate, controller.createProduct);
router.put(
  "/:id",
  adminLock,
  productIdParam,
  productBody,
  validate,
  controller.updateProduct,
);
router.delete("/:id", adminLock, productIdParam, validate, controller.deleteProduct);

export default router;

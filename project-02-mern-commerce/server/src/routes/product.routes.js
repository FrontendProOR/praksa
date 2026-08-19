import { Router } from "express";
import * as controller from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
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
 * Mutations require a valid session cookie and the admin role. This is the
 * only authorization boundary that matters - the React client's route guards
 * are convenience only.
 */
const router = Router();

// Public
router.get("/", controller.listProducts);
router.get("/:slug", productSlugParam, validate, controller.getProductBySlug);

// Admin only
router.post(
  "/",
  authenticate,
  authorize("admin"),
  productBody,
  validate,
  controller.createProduct,
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  productIdParam,
  productBody,
  validate,
  controller.updateProduct,
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  productIdParam,
  validate,
  controller.deleteProduct,
);

export default router;

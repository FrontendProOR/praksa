import { Router } from "express";
import * as controller from "../controllers/category.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  categoryBody,
  categoryIdParam,
  categorySlugParam,
} from "../middleware/category.validation.js";

/**
 * Category routes. Only bindings live here - no logic.
 *
 * Mutations require a valid session cookie and the admin role.
 */
const router = Router();

// Public
router.get("/", controller.listCategories);
router.get("/:slug", categorySlugParam, validate, controller.getCategoryBySlug);

// Admin only
router.post(
  "/",
  authenticate,
  authorize("admin"),
  categoryBody,
  validate,
  controller.createCategory,
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  categoryIdParam,
  categoryBody,
  validate,
  controller.updateCategory,
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  categoryIdParam,
  validate,
  controller.deleteCategory,
);

export default router;

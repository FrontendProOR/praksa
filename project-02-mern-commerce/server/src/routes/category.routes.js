import { Router } from "express";
import * as controller from "../controllers/category.controller.js";
import { validate } from "../middleware/validate.js";
import { adminLock } from "../middleware/adminLock.js";
import {
  categoryBody,
  categoryIdParam,
  categorySlugParam,
} from "../middleware/category.validation.js";

/**
 * Category routes. Only bindings live here - no logic.
 *
 * The three mutation routes are closed by `adminLock` until Day 08 replaces it
 * with `authenticate` + `authorize('admin')`.
 */
const router = Router();

// Public
router.get("/", controller.listCategories);
router.get("/:slug", categorySlugParam, validate, controller.getCategoryBySlug);

// Admin - disabled until authentication exists (Day 08)
router.post("/", adminLock, categoryBody, validate, controller.createCategory);
router.put(
  "/:id",
  adminLock,
  categoryIdParam,
  categoryBody,
  validate,
  controller.updateCategory,
);
router.delete("/:id", adminLock, categoryIdParam, validate, controller.deleteCategory);

export default router;

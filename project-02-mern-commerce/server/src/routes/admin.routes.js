import { Router } from "express";
import * as controller from "../controllers/admin.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { orderStatusBody, orderStatusFilter } from "../middleware/admin.validation.js";

/**
 * Administration routes.
 *
 * `authenticate` and `authorize('admin')` are applied to the whole router, so
 * every route mounted here is protected by construction - a new endpoint
 * cannot be added without the guard by forgetting to repeat it.
 *
 * Product and category mutations are not duplicated here: they already live on
 * `/api/products` and `/api/categories` behind the same admin authorisation.
 */
const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/stats", controller.getStats);
router.get("/products", controller.listAllProducts);
router.get("/orders", orderStatusFilter, validate, controller.listAllOrders);
router.patch("/orders/:id/status", orderStatusBody, validate, controller.updateOrderStatus);

export default router;

import { Router } from "express";
import * as controller from "../controllers/order.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { createOrderBody, orderIdParam } from "../middleware/order.validation.js";

/**
 * Order routes. Every one of them requires a signed-in user.
 *
 * `/mine` is declared before `/:id` so the literal path is matched first
 * rather than being treated as an order id.
 */
const router = Router();

router.post("/", authenticate, createOrderBody, validate, controller.createOrder);
router.get("/mine", authenticate, controller.listMyOrders);
router.get("/:id", authenticate, orderIdParam, validate, controller.getOrder);

export default router;

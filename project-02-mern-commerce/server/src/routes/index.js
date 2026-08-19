import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";
import authRoutes from "./auth.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";

/** Mounts every API router under /api. */
const router = Router();

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);

export default router;

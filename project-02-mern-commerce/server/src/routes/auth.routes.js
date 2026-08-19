import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimiters.js";
import { loginBody, registerBody } from "../middleware/auth.validation.js";

/** Auth routes. Exactly the four endpoints defined by the API contract. */
const router = Router();

router.post("/register", registerBody, validate, controller.register);
router.post("/login", loginLimiter, loginBody, validate, controller.login);
router.post("/logout", controller.logout);
router.get("/me", authenticate, controller.me);

export default router;

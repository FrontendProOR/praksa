import rateLimit from "express-rate-limit";
import { isTest } from "../config/env.js";

/**
 * Rate limiters.
 *
 * The base limiter in `app.js` covers the whole API; login gets a much
 * stricter one because it is the endpoint worth brute-forcing.
 *
 * Both are skipped under NODE_ENV=test so the verification suite - which makes
 * many deliberate failed-login attempts - is not throttled. The limiter itself
 * is exercised by a dedicated check that enables it explicitly.
 */

/** The contract fixes the error codes and has none for rate limiting. */
const tooManyRequests = {
  success: false,
  error: {
    code: "FORBIDDEN",
    message: "Too many login attempts, please try again later",
    details: [],
  },
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => isTest,
  message: tooManyRequests,
});

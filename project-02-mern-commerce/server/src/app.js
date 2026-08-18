import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import apiRoutes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { config, isTest } from "./config/env.js";

/**
 * Builds the Express application.
 *
 * Deliberately free of any database connection or `listen` call, so tests can
 * drive the app without opening a port or reaching MongoDB. `server.js` owns
 * both of those.
 */
export function createApp() {
  const app = express();

  // Security headers. The API serves JSON only, so no CSP for HTML is needed.
  app.use(helmet());

  // The browser must send the session cookie, so the origin cannot be "*".
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Base rate limit for the whole API. The login-specific limiter is Day 08.
  // Skipped under NODE_ENV=test so the verification suite is not throttled.
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 1000,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: () => isTest,
      // The contract fixes the set of error codes and has none for rate
      // limiting, so the closest allowed code is used with HTTP 429.
      message: {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Too many requests, please try again later",
          details: [],
        },
      },
    }),
  );

  app.use("/api", apiRoutes);

  // Terminal handlers, in this order.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;

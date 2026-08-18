import dotenv from "dotenv";

/**
 * Environment configuration.
 *
 * Values are read once, here, so no other module reaches into `process.env`.
 * Startup fails loudly when something required is missing rather than starting
 * a half-configured server.
 *
 * `JWT_SECRET` is present in `.env.example` but is not required yet - the
 * authentication work that needs it arrives on Day 08, and this check is
 * extended then.
 */

dotenv.config();

const REQUIRED = ["MONGODB_URI"];

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number.parseInt(process.env.PORT ?? "5000", 10),
  mongodbUri: process.env.MONGODB_URI ?? "",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
};

export const isProduction = config.nodeEnv === "production";
export const isTest = config.nodeEnv === "test";

/**
 * Verifies that everything the server needs is present.
 *
 * @throws {Error} listing every missing variable at once
 */
export function assertConfig() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy server/.env.example to server/.env and fill in local values.",
    );
  }

  if (!Number.isInteger(config.port) || config.port <= 0) {
    throw new Error(`PORT must be a positive integer, received "${process.env.PORT}".`);
  }
}

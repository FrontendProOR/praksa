import dotenv from "dotenv";

/**
 * Environment configuration.
 *
 * Values are read once, here, so no other module reaches into `process.env`.
 * Startup fails loudly when something required is missing rather than starting
 * a half-configured server - in particular, the API refuses to run without a
 * JWT secret, so tokens can never be signed with an accidental default.
 */

dotenv.config();

const REQUIRED = ["MONGODB_URI", "JWT_SECRET"];

/** A short secret is as good as no secret, so it is rejected outright. */
const MIN_SECRET_LENGTH = 32;

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number.parseInt(process.env.PORT ?? "5000", 10),
  mongodbUri: process.env.MONGODB_URI ?? "",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "60m",
};

export const isProduction = config.nodeEnv === "production";
export const isTest = config.nodeEnv === "test";

/**
 * Verifies that everything the server needs is present.
 *
 * @throws {Error} listing every problem at once, without printing any value
 */
export function assertConfig() {
  const problems = [];

  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    problems.push(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy server/.env.example to server/.env and fill in local values.",
    );
  }

  if (config.jwtSecret && config.jwtSecret.length < MIN_SECRET_LENGTH) {
    problems.push(
      `JWT_SECRET is too short: it must be at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }

  if (config.jwtSecret === "replace_with_a_long_random_secret") {
    problems.push(
      "JWT_SECRET still holds the placeholder value from .env.example. " +
        "Generate a real random secret for this environment.",
    );
  }

  if (!Number.isInteger(config.port) || config.port <= 0) {
    problems.push(`PORT must be a positive integer, received "${process.env.PORT}".`);
  }

  if (problems.length > 0) throw new Error(problems.join("\n"));
}

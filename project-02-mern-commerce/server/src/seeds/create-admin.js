/**
 * Creates or promotes one admin account for development.
 *
 * There is no API route that can grant the admin role - public registration
 * always produces a `user`. This script is the documented way to get an admin,
 * and it is run by hand:
 *
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeMe123' npm run seed:admin
 *
 * Nothing is hardcoded: both values come from the environment, the password is
 * never printed or logged, and the script refuses to run in production unless
 * ALLOW_PRODUCTION_ADMIN_SEED is set deliberately.
 */
import mongoose from "mongoose";
import { assertConfig, config, isProduction } from "../config/env.js";
import { connectDatabase, disconnectDatabase, describeConnection } from "../config/db.js";
import User from "../models/User.js";
import { hashPassword, PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from "../utils/password.js";

async function main() {
  assertConfig();

  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = (process.env.ADMIN_NAME ?? "Development Admin").trim();

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be provided.\n" +
        "Example: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeMe123' npm run seed:admin",
    );
  }

  if (!PASSWORD_PATTERN.test(password)) {
    throw new Error(`ADMIN_PASSWORD is too weak. ${PASSWORD_RULE_MESSAGE}.`);
  }

  if (isProduction && !process.env.ALLOW_PRODUCTION_ADMIN_SEED) {
    throw new Error(
      "Refusing to seed an admin while NODE_ENV=production. " +
        "Set ALLOW_PRODUCTION_ADMIN_SEED=1 only if this is genuinely intended.",
    );
  }

  await connectDatabase(config.mongodbUri);
  console.log(`Connected to ${describeConnection(config.mongodbUri)}`);

  const passwordHash = await hashPassword(password);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.name = name;
    existing.role = "admin";
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Existing account ${email} promoted to admin and password reset.`);
  } else {
    await User.create({ name, email, passwordHash, role: "admin" });
    console.log(`Admin account created for ${email}.`);
  }

  console.log("Password was read from ADMIN_PASSWORD and is not printed here.");
  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error(`Admin seed failed: ${error.message}`);
  if (mongoose.connection.readyState !== 0) await disconnectDatabase();
  process.exit(1);
});

/**
 * Model barrel.
 *
 * Importing this module registers all four Mongoose models. It performs no
 * database connection, so it can also be used as a quick syntax/registration
 * check: `npm run check:models`.
 */
import mongoose from "mongoose";
import User from "./User.js";
import Category from "./Category.js";
import Product from "./Product.js";
import Order from "./Order.js";

export { User, Category, Product, Order };

// Executed only when this file is run directly, not when it is imported.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  const names = Object.keys(mongoose.models).sort().join(", ");
  console.log(`Registered Mongoose models: ${names}`);
}

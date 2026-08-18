import mongoose from "mongoose";

/**
 * MongoDB connection handling.
 *
 * `app.js` never imports this module: the Express application must be usable
 * in tests without a database, and the connection is opened by `server.js`
 * before the port is opened.
 */

/** Never print credentials that may be embedded in a connection string. */
function safeUri(uri) {
  return uri.replace(/\/\/[^@]*@/, "//<credentials>@");
}

/**
 * Opens the MongoDB connection.
 *
 * @param {string} uri MongoDB connection string
 * @param {{ serverSelectionTimeoutMS?: number }} [options]
 * @returns {Promise<typeof mongoose>}
 * @throws {Error} when the server cannot be reached
 */
export async function connectDatabase(uri, options = {}) {
  if (!uri) throw new Error("MONGODB_URI is required to connect to MongoDB.");

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: options.serverSelectionTimeoutMS ?? 8000,
  });

  return mongoose;
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
}

/** Human-readable connection target, safe to log. */
export function describeConnection(uri) {
  return safeUri(uri);
}

export function connectionState() {
  return mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting
}

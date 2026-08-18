import { createApp } from "./app.js";
import { assertConfig, config } from "./config/env.js";
import { connectDatabase, describeConnection, disconnectDatabase } from "./config/db.js";

/**
 * Process entry point: validate configuration, connect to MongoDB, then open
 * the port. If either step fails the process exits with a clear message
 * instead of serving requests against a database that is not there.
 */

async function start() {
  try {
    assertConfig();
  } catch (error) {
    console.error(`Configuration error: ${error.message}`);
    process.exit(1);
  }

  try {
    await connectDatabase(config.mongodbUri);
    console.log(`MongoDB connected: ${describeConnection(config.mongodbUri)}`);
  } catch (error) {
    console.error(
      `Could not connect to MongoDB at ${describeConnection(config.mongodbUri)}\n` +
        `Reason: ${error.message}\n` +
        "Start a local MongoDB server and check MONGODB_URI in server/.env.",
    );
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(
      `API listening on http://localhost:${config.port}/api (${config.nodeEnv})`,
    );
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down.`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();

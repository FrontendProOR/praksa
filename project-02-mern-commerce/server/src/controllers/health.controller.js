import { connectionState } from "../config/db.js";
import { sendOk } from "../utils/respond.js";

const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

/**
 * Liveness endpoint. Reports that the API process is running and whether the
 * database connection is up. It deliberately exposes no configuration values,
 * connection string or secret.
 */
export function getHealth(req, res) {
  return sendOk(res, {
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    database: DB_STATES[connectionState()] ?? "unknown",
  });
}

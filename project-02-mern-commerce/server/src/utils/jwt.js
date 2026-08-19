import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

/**
 * Access-token signing and verification.
 *
 * The payload is deliberately minimal - the subject and the role only. No
 * email, name or any other user data goes into the token, because a JWT is
 * readable by anyone holding it.
 */

/**
 * @param {{ id: string, role: string }} user
 * @returns {string} signed JWT
 */
export function signAccessToken(user) {
  return jwt.sign({ role: user.role }, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Verifies signature and expiry.
 *
 * @param {string} token
 * @returns {{ sub: string, role: string, iat: number, exp: number }}
 * @throws {jwt.JsonWebTokenError} malformed, wrong signature or expired
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

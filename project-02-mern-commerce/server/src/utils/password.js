import bcrypt from "bcryptjs";

/**
 * Password hashing.
 *
 * Plaintext passwords are never stored, logged or returned - only the bcrypt
 * hash reaches the database. Each hash embeds its own random salt, so two
 * users with the same password still get different hashes.
 */

/** Work factor. 12 is a reasonable balance for this project. */
const SALT_ROUNDS = 12;

/** Minimum policy: at least 8 characters, containing a letter and a digit. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const PASSWORD_RULE_MESSAGE =
  `Password must be at least ${PASSWORD_MIN_LENGTH} characters ` +
  "and contain at least one letter and one number";

/**
 * @param {string} plainPassword
 * @returns {Promise<string>} bcrypt hash
 */
export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Constant-time comparison performed by bcrypt itself.
 *
 * @param {string} plainPassword
 * @param {string} passwordHash
 * @returns {Promise<boolean>}
 */
export function verifyPassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plainPassword, passwordHash);
}

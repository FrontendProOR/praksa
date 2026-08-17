import mongoose from "mongoose";

/**
 * User account.
 *
 * Only a bcrypt hash is ever persisted - there is no `password` path on this
 * schema, so a plaintext password cannot reach MongoDB through the model.
 * `passwordHash` is also excluded from query results by default; the login
 * flow must ask for it explicitly with `.select("+passwordHash")`.
 */

export const USER_ROLES = ["user", "admin"];

/** Fields public registration is allowed to set. `role` is deliberately absent. */
export const REGISTRATION_FIELDS = ["name", "email", "passwordHash"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minLength: [2, "Name must be at least 2 characters"],
      maxLength: [80, "Name must be at most 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, "Email format is not valid"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: "Role must be one of: user, admin",
      },
      default: "user",
    },
  },
  { timestamps: true },
);

/**
 * Builds a user document from a registration payload.
 *
 * Only whitelisted fields are copied, so a client that sends
 * `role: "admin"` in the request body cannot escalate: the schema default
 * (`user`) always applies. Admin accounts come from the seed script or a
 * manual database change instead.
 *
 * @param {{ name: string, email: string, passwordHash: string }} payload
 * @returns {mongoose.Document} unsaved user document with role "user"
 */
userSchema.statics.fromRegistration = function fromRegistration(payload = {}) {
  const safe = {};
  for (const field of REGISTRATION_FIELDS) {
    if (payload[field] !== undefined) safe[field] = payload[field];
  }
  safe.role = "user";
  return new this(safe);
};

/** API serialisation: expose `id`, never the hash or the version key. */
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (document, plain) => {
    delete plain._id;
    delete plain.passwordHash;
    return plain;
  },
});

const User = mongoose.model("User", userSchema);

export default User;

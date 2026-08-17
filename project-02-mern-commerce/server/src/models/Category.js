import mongoose from "mongoose";
import { slugify } from "../utils/slugify.js";

/**
 * Product category.
 *
 * The slug is the public identifier used by `GET /api/categories/:slug` and by
 * the `category=` filter on the product listing, so it is normalised in the
 * model rather than trusted from the request body.
 *
 * Deleting a category that active products still reference must fail with
 * HTTP 409; that check belongs to the category service (Day 07) because it
 * needs to query the Product collection.
 */

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, "Description must be at most 500 characters"],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

/**
 * Normalise the slug, deriving it from the name when none was supplied.
 *
 * Written without the `next` callback on purpose: in Mongoose 9 a
 * callback-style pre-validate hook returns a ValidationError with an empty
 * `errors` map, which would strip the per-field messages the API reports.
 */
categorySchema.pre("validate", function normaliseSlug() {
  const source = this.slug || this.name;
  const normalised = slugify(source);
  if (normalised) this.slug = normalised;
});

categorySchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (document, plain) => {
    delete plain._id;
    return plain;
  },
});

const Category = mongoose.model("Category", categorySchema);

export default Category;

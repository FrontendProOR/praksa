import mongoose from "mongoose";
import { slugify } from "../utils/slugify.js";

/**
 * Catalogue product.
 *
 * `price` and `stock` here are the only authoritative values in the system:
 * the browser cart holds copies for display, but every order recomputes line
 * prices and checks stock against this collection.
 *
 * Public listings must filter on `active: true`; the admin listing may include
 * inactive products.
 */

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxLength: [160, "Name must be at most 160 characters"],
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      maxLength: [300, "Short description must be at most 300 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxLength: [5000, "Description must be at most 5000 characters"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare-at price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

/**
 * A compare-at price is the previous/list price shown struck through, so it is
 * only meaningful when it is at least the current price.
 */
productSchema.path("compareAtPrice").validate(function comparePrice(value) {
  if (value === undefined || value === null) return true;
  return value >= this.price;
}, "Compare-at price must be greater than or equal to price");

/**
 * Normalise the slug, deriving it from the name when none was supplied.
 *
 * Written without the `next` callback on purpose: in Mongoose 9 a
 * callback-style pre-validate hook returns a ValidationError with an empty
 * `errors` map, which would strip the per-field messages the API reports.
 */
productSchema.pre("validate", function normaliseSlug() {
  const source = this.slug || this.name;
  const normalised = slugify(source);
  if (normalised) this.slug = normalised;
});

productSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (document, plain) => {
    delete plain._id;
    return plain;
  },
});

const Product = mongoose.model("Product", productSchema);

export default Product;

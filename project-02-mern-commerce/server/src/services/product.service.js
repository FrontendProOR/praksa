import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Product business rules and catalogue queries.
 *
 * `price` and `stock` written here are the authoritative values for the whole
 * system; the browser cart only ever holds display copies of them.
 */

export const SORT_OPTIONS = Object.freeze({
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
});

export const DEFAULT_SORT = "newest";
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 12;
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 48;

/** Escapes user input before it is used inside a regular expression. */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Normalises catalogue query parameters.
 *
 * Out-of-range or unparsable values are clamped to the documented bounds and
 * an unsupported sort falls back to `newest`, so a hand-edited URL cannot
 * break the catalogue.
 */
export function normaliseListQuery(query = {}) {
  const parsedPage = Number.parseInt(query.page, 10);
  const parsedLimit = Number.parseInt(query.limit, 10);

  return {
    q: typeof query.q === "string" ? query.q.trim() : "",
    category: typeof query.category === "string" ? query.category.trim() : "",
    sort: Object.hasOwn(SORT_OPTIONS, query.sort) ? query.sort : DEFAULT_SORT,
    page: Number.isNaN(parsedPage) ? DEFAULT_PAGE : Math.max(parsedPage, 1),
    limit: Number.isNaN(parsedLimit)
      ? DEFAULT_LIMIT
      : clamp(parsedLimit, MIN_LIMIT, MAX_LIMIT),
    featured:
      query.featured === "true" ? true : query.featured === "false" ? false : undefined,
  };
}

/**
 * Lists products with search, category filter, sorting and pagination.
 *
 * Public callers get active products only; the admin listing (Day 13) passes
 * `includeInactive`.
 *
 * @returns {Promise<{ items: Array, meta: { page: number, limit: number, totalItems: number, totalPages: number } }>}
 */
export async function listProducts(rawQuery = {}, { includeInactive = false } = {}) {
  const { q, category, sort, page, limit, featured } = normaliseListQuery(rawQuery);

  const filter = {};
  if (!includeInactive) filter.active = true;
  if (featured !== undefined) filter.featured = featured;

  if (category) {
    const categoryDoc = await Category.findOne({ slug: category }).select("_id");
    // An unknown category slug is not an error: it simply matches nothing.
    if (!categoryDoc) {
      return { items: [], meta: { page, limit, totalItems: 0, totalPages: 0 } };
    }
    filter.category = categoryDoc._id;
  }

  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { name: pattern },
      { shortDescription: pattern },
      { tags: pattern },
    ];
  }

  const skip = (page - 1) * limit;

  const [items, totalItems] = await Promise.all([
    Product.find(filter)
      .sort(SORT_OPTIONS[sort])
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug"),
    Product.countDocuments(filter),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
}

/**
 * Public product lookup by slug. Inactive products are treated as missing so
 * the public API never reveals them.
 */
export async function getProductBySlug(slug, { includeInactive = false } = {}) {
  const filter = includeInactive ? { slug } : { slug, active: true };
  const product = await Product.findOne(filter).populate("category", "name slug");
  if (!product) throw ApiError.notFound(`Product "${slug}" was not found`);
  return product;
}

export async function getProductById(id) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound("Product was not found");
  return product;
}

/** Rejects a product payload that points at a category which does not exist. */
async function assertCategoryExists(categoryId) {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) {
    throw ApiError.validation("Category does not exist", [
      { field: "category", message: "No category with this id" },
    ]);
  }
}

function applyPayload(product, payload) {
  product.name = payload.name;
  if (payload.slug !== undefined) product.slug = payload.slug;
  product.sku = payload.sku;
  product.shortDescription = payload.shortDescription;
  product.description = payload.description;
  product.category = payload.category;
  product.price = payload.price;
  product.compareAtPrice = payload.compareAtPrice;
  product.imageUrl = payload.imageUrl;
  if (payload.stock !== undefined) product.stock = payload.stock;
  if (payload.featured !== undefined) product.featured = payload.featured;
  if (payload.active !== undefined) product.active = payload.active;
  if (payload.tags !== undefined) product.tags = payload.tags;
  return product;
}

export async function createProduct(payload) {
  await assertCategoryExists(payload.category);
  const product = applyPayload(new Product(), payload);
  return product.save();
}

/** Full update: the payload carries every field the create endpoint requires. */
export async function updateProduct(id, payload) {
  const product = await getProductById(id);
  await assertCategoryExists(payload.category);
  applyPayload(product, payload);
  return product.save();
}

export async function deleteProduct(id) {
  const product = await getProductById(id);
  await product.deleteOne();
  return { id: product.id };
}

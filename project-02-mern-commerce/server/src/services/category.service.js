import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Category business rules.
 *
 * Nothing here knows about `req` or `res`; controllers translate the results
 * into HTTP responses. That keeps these functions directly testable without
 * going through routes - which matters while the admin routes are closed
 * until authentication exists.
 */

/**
 * @param {{ activeOnly?: boolean }} [options]
 * @returns {Promise<Array>} categories sorted by name
 */
export async function listCategories({ activeOnly = true } = {}) {
  const filter = activeOnly ? { active: true } : {};
  return Category.find(filter).sort({ name: 1 });
}

export async function getCategoryBySlug(slug) {
  const category = await Category.findOne({ slug });
  if (!category) throw ApiError.notFound(`Category "${slug}" was not found`);
  return category;
}

export async function getCategoryById(id) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound("Category was not found");
  return category;
}

export async function createCategory(payload) {
  const category = new Category({
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    active: payload.active,
  });
  return category.save();
}

/**
 * Full update of an existing category. Duplicate name/slug surfaces as a
 * MongoDB duplicate-key error, which the central handler turns into 409.
 */
export async function updateCategory(id, payload) {
  const category = await getCategoryById(id);

  category.name = payload.name;
  category.slug = payload.slug ?? category.slug;
  category.description = payload.description;
  if (payload.active !== undefined) category.active = payload.active;

  return category.save();
}

/**
 * Deletes a category.
 *
 * Refuses with 409 while active products still reference it. Products are
 * never cascade-deleted and never silently reassigned: an admin has to move
 * them to another category first.
 */
export async function deleteCategory(id) {
  const category = await getCategoryById(id);

  const productsInUse = await Product.countDocuments({
    category: category._id,
    active: true,
  });

  if (productsInUse > 0) {
    throw ApiError.conflict(
      `Category "${category.name}" still has ${productsInUse} active product(s). ` +
        "Reassign or deactivate them before deleting the category.",
      [{ field: "category", message: `${productsInUse} active product(s) reference this category` }],
    );
  }

  await category.deleteOne();
  return { id: category.id };
}

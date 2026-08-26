import { apiClient, unwrap } from "./client.js";

/**
 * Category endpoints.
 *
 * Categories are always read from the API so the names and slugs shown in the
 * UI cannot drift from what is actually in MongoDB.
 */

/**
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Array>} active categories, sorted by name
 */
export async function fetchCategories({ signal } = {}) {
  const response = await apiClient.get("/categories", { signal });
  return unwrap(response).data.categories ?? [];
}

/** Admin: creates a category. */
export async function createCategory(payload) {
  const response = await apiClient.post('/categories', payload);
  return unwrap(response).data.category;
}

/** Admin: updates a category. */
export async function updateCategory(id, payload) {
  const response = await apiClient.put(`/categories/${encodeURIComponent(id)}`, payload);
  return unwrap(response).data.category;
}

/**
 * Admin: deletes a category.
 *
 * The API refuses with 409 CONFLICT while active products still reference it;
 * that error is shown to the administrator rather than worked around.
 */
export async function deleteCategory(id) {
  const response = await apiClient.delete(`/categories/${encodeURIComponent(id)}`);
  return unwrap(response).data;
}

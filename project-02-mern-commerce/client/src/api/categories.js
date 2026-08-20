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

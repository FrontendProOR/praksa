import { apiClient, unwrap } from "./client.js";

/**
 * Product endpoints.
 *
 * The catalogue query parameters the API supports (q, category, sort, page,
 * limit, featured) are passed straight through; the storefront currently uses
 * the API defaults plus `featured` on the home page.
 */

/**
 * @param {{ q?: string, category?: string, sort?: string, page?: number, limit?: number, featured?: boolean }} [params]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ products: Array, meta: { page: number, limit: number, totalItems: number, totalPages: number } }>}
 */
export async function fetchProducts(params = {}, { signal } = {}) {
  const response = await apiClient.get("/products", { params, signal });
  const { data, meta } = unwrap(response);
  return { products: data.products ?? [], meta };
}

/**
 * @param {string} slug
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<object>} the product, with its category populated
 */
export async function fetchProductBySlug(slug, { signal } = {}) {
  const response = await apiClient.get(`/products/${encodeURIComponent(slug)}`, {
    signal,
  });
  return unwrap(response).data.product;
}

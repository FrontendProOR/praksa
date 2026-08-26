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

/**
 * Admin: creates a product. The route is already admin-protected, so there is
 * no separate admin endpoint for it.
 *
 * @param {object} payload full product body
 */
export async function createProduct(payload) {
  const response = await apiClient.post('/products', payload);
  return unwrap(response).data.product;
}

/** Admin: full update of an existing product. */
export async function updateProduct(id, payload) {
  const response = await apiClient.put(`/products/${encodeURIComponent(id)}`, payload);
  return unwrap(response).data.product;
}

/** Admin: permanently deletes a product. */
export async function deleteProduct(id) {
  const response = await apiClient.delete(`/products/${encodeURIComponent(id)}`);
  return unwrap(response).data;
}

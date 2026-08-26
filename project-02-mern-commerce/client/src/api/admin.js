import { apiClient, unwrap } from "./client.js";

/**
 * Administration endpoints.
 *
 * Only the four `/api/admin/*` reads and the status update live here. Creating,
 * editing and deleting products and categories reuse the existing modules -
 * those endpoints are already admin-protected, and duplicating them would mean
 * two contracts to keep in step.
 */

/** @returns {Promise<object>} dashboard counts, orders by status and demo revenue */
export async function fetchAdminStats({ signal } = {}) {
  const response = await apiClient.get("/admin/stats", { signal });
  return unwrap(response).data.stats;
}

/**
 * Every product, including inactive ones.
 *
 * @param {{ q?: string, category?: string, sort?: string, page?: number, limit?: number }} [params]
 */
export async function fetchAdminProducts(params = {}, { signal } = {}) {
  const response = await apiClient.get("/admin/products", { params, signal });
  const { data, meta } = unwrap(response);
  return { products: data.products ?? [], meta };
}

/**
 * Finds one product by id for the edit form.
 *
 * The public detail endpoint is keyed by slug and hides inactive products, so
 * the admin listing is used instead. It is paged, and no admin endpoint takes
 * an id, so this walks the pages until the product turns up - correct whatever
 * the catalogue grows to, and a single request for a small one.
 *
 * @param {string} id
 * @returns {Promise<object|null>} the product, or null if no page contains it
 */
export async function fetchAdminProductById(id, { signal } = {}) {
  const limit = 48;
  let page = 1;
  let totalPages = 1;

  do {
    const { products, meta } = await fetchAdminProducts({ page, limit }, { signal });
    const match = products.find((product) => product.id === id);
    if (match) return match;

    totalPages = meta?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return null;
}

/**
 * Orders across all customers.
 *
 * @param {{ status?: string }} [params]
 */
export async function fetchAdminOrders(params = {}, { signal } = {}) {
  const response = await apiClient.get("/admin/orders", { params, signal });
  return unwrap(response).data.orders ?? [];
}

/**
 * Moves an order to the next status. The server decides which moves are legal
 * and returns the stored order, which is what the UI then renders.
 *
 * @param {string} id
 * @param {string} orderStatus
 */
export async function updateOrderStatus(id, orderStatus) {
  const response = await apiClient.patch(`/admin/orders/${encodeURIComponent(id)}/status`, {
    orderStatus,
  });
  return unwrap(response).data.order;
}

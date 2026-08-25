import { apiClient, unwrap } from "./client.js";

/**
 * Order endpoints. All of them require the session cookie.
 *
 * Only product ids and quantities are sent for the line items: prices, totals
 * and statuses are the server's to decide, and anything of that sort in the
 * request body would simply be ignored.
 */

/**
 * @param {{ items: Array<{ product: string, quantity: number }>, shippingAddress: object, paymentMethod: string }} payload
 * @returns {Promise<object>} the created order, priced by the server
 */
export async function createOrder({ items, shippingAddress, paymentMethod }) {
  const response = await apiClient.post("/orders", { items, shippingAddress, paymentMethod });
  return unwrap(response).data.order;
}

/** @returns {Promise<Array>} the signed-in user's orders, newest first */
export async function fetchMyOrders({ signal } = {}) {
  const response = await apiClient.get("/orders/mine", { signal });
  return unwrap(response).data.orders ?? [];
}

/** @returns {Promise<object>} one order the signed-in user is allowed to read */
export async function fetchOrder(id, { signal } = {}) {
  const response = await apiClient.get(`/orders/${encodeURIComponent(id)}`, { signal });
  return unwrap(response).data.order;
}

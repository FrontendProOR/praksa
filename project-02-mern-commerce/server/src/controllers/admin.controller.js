import * as adminService from "../services/admin.service.js";
import * as productService from "../services/product.service.js";
import { sendOk } from "../utils/respond.js";

/**
 * Admin controllers.
 *
 * The product listing reuses the catalogue service with `includeInactive`, so
 * there is one implementation of search, sorting and pagination rather than a
 * parallel admin copy that could drift.
 */

export async function getStats(req, res) {
  const stats = await adminService.getDashboardStats();
  return sendOk(res, { stats });
}

export async function listAllProducts(req, res) {
  const { items, meta } = await productService.listProducts(req.query, {
    includeInactive: true,
  });
  return sendOk(res, { products: items }, meta);
}

export async function listAllOrders(req, res) {
  const orders = await adminService.listAllOrders({ status: req.query.status });
  return sendOk(res, { orders });
}

export async function updateOrderStatus(req, res) {
  const order = await adminService.updateOrderStatus(req.params.id, req.body.orderStatus);
  return sendOk(res, { order });
}

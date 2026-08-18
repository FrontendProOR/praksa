import * as productService from "../services/product.service.js";
import { sendCreated, sendOk } from "../utils/respond.js";

/**
 * Product controllers. Business rules and queries live in the service; these
 * functions only bridge HTTP and the service layer.
 */

export async function listProducts(req, res) {
  const { items, meta } = await productService.listProducts(req.query);
  return sendOk(res, { products: items }, meta);
}

export async function getProductBySlug(req, res) {
  const product = await productService.getProductBySlug(req.params.slug);
  return sendOk(res, { product });
}

export async function createProduct(req, res) {
  const product = await productService.createProduct(req.body);
  return sendCreated(res, { product });
}

export async function updateProduct(req, res) {
  const product = await productService.updateProduct(req.params.id, req.body);
  return sendOk(res, { product });
}

export async function deleteProduct(req, res) {
  const result = await productService.deleteProduct(req.params.id);
  return sendOk(res, { deleted: result.id });
}

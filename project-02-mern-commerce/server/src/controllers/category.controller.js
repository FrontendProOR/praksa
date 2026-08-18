import * as categoryService from "../services/category.service.js";
import { sendCreated, sendOk } from "../utils/respond.js";

/**
 * Category controllers: read validated input, call the service, shape the
 * response. No database access and no business rules live here.
 *
 * Express 5 forwards rejected promises to the error handler automatically, so
 * these handlers need no try/catch wrapper.
 */

export async function listCategories(req, res) {
  const categories = await categoryService.listCategories({ activeOnly: true });
  return sendOk(res, { categories });
}

export async function getCategoryBySlug(req, res) {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  return sendOk(res, { category });
}

export async function createCategory(req, res) {
  const category = await categoryService.createCategory(req.body);
  return sendCreated(res, { category });
}

export async function updateCategory(req, res) {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return sendOk(res, { category });
}

export async function deleteCategory(req, res) {
  const result = await categoryService.deleteCategory(req.params.id);
  return sendOk(res, { deleted: result.id });
}

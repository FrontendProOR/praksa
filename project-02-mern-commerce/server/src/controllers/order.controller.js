import * as orderService from "../services/order.service.js";
import { sendCreated, sendOk } from "../utils/respond.js";

/**
 * Order controllers.
 *
 * The owner of every order comes from `req.user`, which the authenticate
 * middleware derived from the signed session cookie. A user id in the request
 * body is never read.
 */

export async function createOrder(req, res) {
  const order = await orderService.createOrder({
    userId: req.user.id,
    items: req.body.items,
    shippingAddress: req.body.shippingAddress,
    paymentMethod: req.body.paymentMethod,
  });

  return sendCreated(res, { order });
}

export async function listMyOrders(req, res) {
  const orders = await orderService.listUserOrders(req.user.id);
  return sendOk(res, { orders });
}

export async function getOrder(req, res) {
  const order = await orderService.getOrderForUser(req.params.id, {
    id: req.user.id,
    role: req.user.role,
  });

  return sendOk(res, { order });
}

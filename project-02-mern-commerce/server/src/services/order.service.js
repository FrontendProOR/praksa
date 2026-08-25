import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Order business rules.
 *
 * The client sends only product ids, quantities, a shipping address and a
 * payment method. Everything that determines what the customer owes - unit
 * prices, line totals, subtotal, shipping and total - is computed here from
 * the products as they exist in MongoDB right now. A price, total, status or
 * user id in the request body is never read.
 */

/** Shipping rule: a flat fee, waived once the subtotal reaches the threshold. */
export const SHIPPING_FLAT_FEE = 6.9;
export const FREE_SHIPPING_THRESHOLD = 100;

/** Money is rounded to two decimals at every step so totals always add up. */
const money = (value) => Math.round(value * 100) / 100;

export function calculateShipping(subtotal) {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_FEE;
}

/**
 * Collapses duplicate ids so the same product cannot appear twice and slip
 * past the stock check by being validated in two separate lines.
 *
 * @param {Array<{ product: string, quantity: number }>} items
 * @returns {Map<string, number>} product id -> total quantity
 */
function mergeRequestedItems(items) {
  const merged = new Map();
  for (const item of items) {
    const id = String(item.product);
    merged.set(id, (merged.get(id) ?? 0) + Number(item.quantity));
  }
  return merged;
}

/**
 * Restores stock that was already taken when a later step fails.
 *
 * The database is a standalone deployment, so there are no multi-document
 * transactions to roll back with. Compensation is best effort and is logged
 * loudly if it fails, because that would leave stock understated.
 */
async function restoreStock(applied) {
  for (const { productId, quantity } of applied) {
    try {
      await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });
    } catch (error) {
      console.error(
        `Failed to restore ${quantity} unit(s) of product ${productId} after a failed order.`,
        error,
      );
    }
  }
}

/**
 * Creates an order for the authenticated user.
 *
 * Sequence (documented non-transactional fallback - see the requirements
 * document, section 7.3):
 *
 *  1. load every referenced product and reject missing or inactive ones;
 *  2. reject quantities the current stock cannot cover, so the common case
 *     fails with a clear message before anything is written;
 *  3. price the order from the database values;
 *  4. decrement stock one product at a time with a conditional update that
 *     only matches while enough stock remains - this is what actually
 *     prevents overselling under concurrency, since step 2 alone would race;
 *  5. if any decrement fails, put back everything already taken and stop;
 *  6. only then write the order; if that write fails, put the stock back too.
 *
 * @param {{ userId: string, items: Array, shippingAddress: object, paymentMethod: string }} input
 * @returns {Promise<object>} the created order
 */
export async function createOrder({ userId, items, shippingAddress, paymentMethod }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.validation("An order must contain at least one item", [
      { field: "items", message: "Item list is empty" },
    ]);
  }

  const requested = mergeRequestedItems(items);
  const ids = [...requested.keys()];

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw ApiError.validation("Invalid product id in the item list", [
      { field: "items", message: "One of the product ids is not valid" },
    ]);
  }

  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((product) => [product.id, product]));

  // 1. Missing or inactive products.
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw ApiError.notFound(
      missing.length === 1
        ? "A product in your cart no longer exists"
        : "Some products in your cart no longer exist",
    );
  }

  const inactive = ids.filter((id) => !byId.get(id).active);
  if (inactive.length > 0) {
    throw ApiError.validation("A product in your cart is no longer available", [
      ...inactive.map((id) => ({ field: "items", message: `${byId.get(id).name} is not available` })),
    ]);
  }

  // 2. Stock pre-check, for a clear message before anything is written.
  const short = ids.filter((id) => byId.get(id).stock < requested.get(id));
  if (short.length > 0) {
    throw ApiError.outOfStock("Not enough stock for one or more items", [
      ...short.map((id) => ({
        field: "items",
        message: `${byId.get(id).name}: ${byId.get(id).stock} in stock, ${requested.get(id)} requested`,
      })),
    ]);
  }

  // 3. Price the order from the database, never from the request.
  const orderItems = ids.map((id) => {
    const product = byId.get(id);
    const quantity = requested.get(id);
    const unitPrice = money(product.price);
    return {
      product: product._id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice,
      lineTotal: money(unitPrice * quantity),
    };
  });

  const subtotal = money(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const shippingCost = money(calculateShipping(subtotal));
  const total = money(subtotal + shippingCost);

  // 4/5. Take the stock atomically; put it back if any step fails.
  const applied = [];
  for (const item of orderItems) {
    const result = await Product.updateOne(
      { _id: item.product, active: true, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
    );

    if (result.modifiedCount !== 1) {
      await restoreStock(applied);
      throw ApiError.outOfStock(
        `Not enough stock for ${item.name}. Someone may have bought the last one while you were checking out.`,
        [{ field: "items", message: `${item.name} is no longer available in that quantity` }],
      );
    }

    applied.push({ productId: item.product, quantity: item.quantity });
  }

  // 6. Persist the order; undo the stock if this fails.
  try {
    return await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost,
      total,
      paymentMethod,
      // A demo card "payment" is marked as paid; cash on delivery stays pending.
      paymentStatus: paymentMethod === "card_demo" ? "paid_demo" : "pending",
      orderStatus: "pending",
    });
  } catch (error) {
    await restoreStock(applied);
    throw error;
  }
}

/**
 * Orders belonging to one user, newest first.
 *
 * @param {string} userId taken from the session, never from the request
 */
export async function listUserOrders(userId) {
  return Order.find({ user: userId }).sort({ createdAt: -1 });
}

/**
 * Reads one order.
 *
 * A normal user may only read their own; an admin may read any. A signed-in
 * user asking for someone else's order is refused with 403 - the order exists,
 * they simply may not see it.
 *
 * @param {string} orderId
 * @param {{ id: string, role: string }} currentUser
 */
export async function getOrderForUser(orderId, currentUser) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Order was not found");

  const isOwner = String(order.user) === String(currentUser.id);
  if (!isOwner && currentUser.role !== "admin") {
    throw ApiError.forbidden("You can only view your own orders");
  }

  return order;
}

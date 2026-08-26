import Category from "../models/Category.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { ORDER_STATUSES } from "../models/Order.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Administration business rules.
 *
 * The catalogue listing and the product/category mutations already exist in
 * their own services and are reused as they are - there is no second set of
 * admin CRUD. What lives here is the dashboard summary, the cross-user order
 * listing and the status transition rule, none of which have a public
 * counterpart.
 */

/**
 * Which status an order may move to next.
 *
 * `delivered` and `cancelled` are final: an order that has arrived cannot go
 * back to pending, and a cancelled one is not resurrected by changing a
 * dropdown. Anything outside this map is refused, so the client cannot invent
 * a transition even with a valid enum value.
 */
export const ORDER_STATUS_TRANSITIONS = Object.freeze({
  pending: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
});

/**
 * Dashboard summary, computed from MongoDB.
 *
 * "Revenue" is deliberately narrow: it sums the totals of orders that are not
 * cancelled, which is what the specification defines. It is demo money from a
 * demo shop - cash-on-delivery orders are counted even though nothing has
 * actually been paid, so the figure is labelled as such in the UI rather than
 * presented as takings.
 *
 * @returns {Promise<object>} counts, orders grouped by status and demo revenue
 */
export async function getDashboardStats() {
  const [
    totalProducts,
    activeProducts,
    outOfStockProducts,
    totalCategories,
    totalUsers,
    totalOrders,
    statusGroups,
    revenueGroup,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ active: true }),
    Product.countDocuments({ stock: 0 }),
    Category.countDocuments(),
    User.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);

  // Every status is present, so the dashboard never has to guess about a
  // missing key.
  const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));
  for (const group of statusGroups) {
    if (group._id in ordersByStatus) ordersByStatus[group._id] = group.count;
  }

  return {
    products: {
      total: totalProducts,
      active: activeProducts,
      inactive: totalProducts - activeProducts,
      outOfStock: outOfStockProducts,
    },
    categories: { total: totalCategories },
    users: { total: totalUsers },
    orders: {
      total: totalOrders,
      byStatus: ordersByStatus,
      pending: ordersByStatus.pending,
    },
    // Rounded to two decimals, like every other money value in the system.
    demoRevenue: Math.round((revenueGroup[0]?.total ?? 0) * 100) / 100,
  };
}

/**
 * Every order, newest first, with the customer's safe fields attached.
 *
 * `populate` selects only name and email - the User model hides the password
 * hash anyway, but the selection keeps the payload to what the screen needs.
 *
 * @param {{ status?: string }} [filters]
 */
export async function listAllOrders({ status } = {}) {
  const filter = {};
  if (status && ORDER_STATUSES.includes(status)) filter.orderStatus = status;

  return Order.find(filter).sort({ createdAt: -1 }).populate("user", "name email");
}

/**
 * Changes an order's status.
 *
 * Only `orderStatus` is touched. The items, totals, shipping snapshot, payment
 * status and owner are not editable here - this endpoint has no business
 * rewriting what a customer bought or what they were charged.
 *
 * @param {string} orderId
 * @param {string} nextStatus
 * @returns {Promise<object>} the updated order
 */
export async function updateOrderStatus(orderId, nextStatus) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Order was not found");

  const current = order.orderStatus;
  const allowed = ORDER_STATUS_TRANSITIONS[current] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw ApiError.validation(
      `An order that is "${current}" cannot be changed to "${nextStatus}"`,
      [
        {
          field: "orderStatus",
          message: allowed.length
            ? `Allowed next statuses: ${allowed.join(", ")}`
            : `"${current}" is a final status`,
        },
      ],
    );
  }

  order.orderStatus = nextStatus;
  await order.save();

  return order.populate("user", "name email");
}

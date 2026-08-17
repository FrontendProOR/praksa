import mongoose from "mongoose";

/**
 * Customer order.
 *
 * Order items are embedded **snapshots**, not live references. `name`, `sku`
 * and `unitPrice` are copied from the product at the moment the order is
 * created, so a later price change, rename or product deletion cannot rewrite
 * order history. `product` is kept as a reference for reporting, but the order
 * stays readable even when the referenced product no longer exists.
 *
 * Every monetary field here is written by the server. The client sends only
 * product ids and quantities; unit prices, line totals, subtotal, shipping and
 * total are recomputed from the Product collection (Day 12).
 */

export const PAYMENT_METHODS = ["cash_on_delivery", "card_demo"];
export const PAYMENT_STATUSES = ["pending", "paid_demo", "failed"];
export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Order item product reference is required"],
    },
    name: {
      type: String,
      required: [true, "Order item name snapshot is required"],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "Order item SKU snapshot is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    lineTotal: {
      type: Number,
      required: [true, "Line total is required"],
      min: [0, "Line total cannot be negative"],
    },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone: { type: String, required: [true, "Phone is required"], trim: true },
    street: { type: String, required: [true, "Street is required"], trim: true },
    city: { type: String, required: [true, "City is required"], trim: true },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order owner is required"],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "An order must contain at least one item",
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    shippingCost: {
      type: Number,
      required: [true, "Shipping cost is required"],
      min: [0, "Shipping cost cannot be negative"],
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: {
        values: PAYMENT_METHODS,
        message: "Payment method must be one of: cash_on_delivery, card_demo",
      },
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: {
        values: PAYMENT_STATUSES,
        message: "Payment status must be one of: pending, paid_demo, failed",
      },
      default: "pending",
    },
    orderStatus: {
      type: String,
      required: true,
      enum: {
        values: ORDER_STATUSES,
        message:
          "Order status must be one of: pending, processing, shipped, delivered, cancelled",
      },
      default: "pending",
    },
  },
  { timestamps: true },
);

orderSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (document, plain) => {
    delete plain._id;
    return plain;
  },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;

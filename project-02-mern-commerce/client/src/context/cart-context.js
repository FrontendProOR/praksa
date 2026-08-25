import { createContext, useContext } from "react";

/**
 * The cart context object and its hook, kept apart from the provider so each
 * module exports one kind of thing.
 */
export const CartContext = createContext(null);

/**
 * Reads the cart.
 *
 * @returns {{
 *   items: Array,
 *   itemCount: number,
 *   subtotal: number,
 *   addItem: (product: object, quantity?: number) => void,
 *   removeItem: (productId: string) => void,
 *   setQuantity: (productId: string, quantity: number) => void,
 *   clearCart: () => void,
 *   toOrderItems: () => Array<{ product: string, quantity: number }>,
 * }}
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}

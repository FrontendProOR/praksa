import { useCallback, useEffect, useMemo, useState } from "react";
import { CartContext } from "./cart-context.js";

/**
 * Shopping cart, held in the browser and persisted to localStorage.
 *
 * There is no cart collection in MongoDB on purpose: a guest can fill a cart
 * without an account, and no server state has to be created or expired for
 * visitors who never buy.
 *
 * The stored `price` and `stock` are **display copies**. They may be stale, and
 * anyone can edit them in dev tools - it changes nothing. At checkout the
 * client sends only product ids and quantities, and the server re-reads both
 * from the database.
 *
 * Nothing sensitive is stored here: no token, no session, no personal data.
 */

const STORAGE_KEY = "smweb-lab-cart-v1";
const MAX_QUANTITY = 99;

/** Keeps a quantity a whole number within sensible bounds. */
function normaliseQuantity(value, max = MAX_QUANTITY) {
  const quantity = Math.trunc(Number(value));
  if (!Number.isFinite(quantity) || quantity < 1) return 1;
  return Math.min(quantity, Math.max(1, max));
}

/** Accepts only entries that still look like a cart line. */
function sanitiseItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (typeof raw.productId !== "string" || !raw.productId) return null;
  if (typeof raw.name !== "string" || !raw.name) return null;

  const price = Number(raw.price);
  const stock = Number(raw.stock);

  return {
    productId: raw.productId,
    slug: typeof raw.slug === "string" ? raw.slug : "",
    name: raw.name,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : "",
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    stock: Number.isFinite(stock) && stock >= 0 ? Math.trunc(stock) : 0,
    quantity: normaliseQuantity(raw.quantity),
  };
}

/**
 * Reads the stored cart.
 *
 * Anything unreadable or malformed is discarded rather than thrown: a corrupted
 * value in localStorage must never stop the application from starting.
 */
function readStoredCart() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set();
    return parsed
      .map(sanitiseItem)
      .filter((item) => {
        if (!item || seen.has(item.productId)) return false;
        seen.add(item.productId);
        return true;
      });
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  // Read once during initialisation, so the first render already has the cart
  // and no effect has to write it straight back.
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // A full or blocked storage must not break the cart in memory.
    }
  }, [items]);

  /**
   * Adds a product, or raises the quantity if it is already in the cart.
   * The known stock caps the quantity - a display guard only; the server
   * checks stock again at checkout.
   */
  const addItem = useCallback((product, quantity = 1) => {
    if (!product?.id || product.stock <= 0) return;

    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      const max = Math.max(1, Math.trunc(product.stock));

      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, stock: max, price: product.price, quantity: normaliseQuantity(item.quantity + quantity, max) }
            : item,
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          stock: max,
          quantity: normaliseQuantity(quantity, max),
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: normaliseQuantity(quantity, item.stock || MAX_QUANTITY) }
          : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  /** The only cart data the API is ever sent. */
  const toOrderItems = useCallback(
    () => items.map((item) => ({ product: item.productId, quantity: item.quantity })),
    [items],
  );

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal =
      Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

    return {
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      toOrderItems,
    };
  }, [items, addItem, removeItem, setQuantity, clearCart, toOrderItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

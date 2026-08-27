import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { CartProvider } from "../context/CartProvider.jsx";
import { useCart } from "../context/cart-context.js";

/**
 * Section 12: a cart behaviour test.
 *
 * The cart is the one piece of state the browser owns, so these tests cover
 * what that ownership must guarantee: quantities stay sane, the same product
 * never appears twice, the cart survives a reload, a corrupted value in
 * localStorage cannot stop the app, and nothing sensitive is ever written
 * there.
 */
const STORAGE_KEY = "smweb-lab-cart-v1";

const PRODUCT = {
  id: "p1",
  slug: "demo-proizvod",
  name: "Demo Proizvod",
  imageUrl: "/images/product-placeholder.svg",
  price: 25,
  stock: 4,
};

const OTHER = { ...PRODUCT, id: "p2", slug: "drugi", name: "Drugi Proizvod", price: 10, stock: 9 };

/** A probe that renders the cart state and exposes its actions as buttons. */
function CartProbe() {
  const cart = useCart();
  return (
    <div>
      <span data-testid="count">{cart.itemCount}</span>
      <span data-testid="subtotal">{cart.subtotal}</span>
      <span data-testid="lines">{cart.items.length}</span>
      <span data-testid="order-items">{JSON.stringify(cart.toOrderItems())}</span>
      <button type="button" onClick={() => cart.addItem(PRODUCT)}>add</button>
      <button type="button" onClick={() => cart.addItem(PRODUCT, 3)}>add three</button>
      <button type="button" onClick={() => cart.addItem(OTHER)}>add other</button>
      <button type="button" onClick={() => cart.addItem({ ...PRODUCT, id: "p3", stock: 0 })}>
        add sold out
      </button>
      <button type="button" onClick={() => cart.setQuantity(PRODUCT.id, 0)}>set zero</button>
      <button type="button" onClick={() => cart.setQuantity(PRODUCT.id, -5)}>set negative</button>
      <button type="button" onClick={() => cart.setQuantity(PRODUCT.id, 999)}>set huge</button>
      <button type="button" onClick={() => cart.removeItem(PRODUCT.id)}>remove</button>
      <button type="button" onClick={() => cart.clearCart()}>clear</button>
    </div>
  );
}

const renderCart = () => render(<CartProvider><CartProbe /></CartProvider>);
const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");

describe("CartContext", () => {
  test("starts empty and adds a product", async () => {
    const user = userEvent.setup();
    renderCart();

    expect(screen.getByTestId("count")).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: "add" }));

    expect(screen.getByTestId("lines")).toHaveTextContent("1");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("25");
  });

  test("adding the same product again raises the quantity instead of duplicating", async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "add" }));
    await user.click(screen.getByRole("button", { name: "add" }));

    expect(screen.getByTestId("lines")).toHaveTextContent("1");
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("50");
  });

  test("the known stock caps the quantity", async () => {
    const user = userEvent.setup();
    renderCart();

    // 3 + 3 = 6 requested, but only 4 are in stock.
    await user.click(screen.getByRole("button", { name: "add three" }));
    await user.click(screen.getByRole("button", { name: "add three" }));

    expect(screen.getByTestId("count")).toHaveTextContent("4");
  });

  test("a sold-out product cannot be added", async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "add sold out" }));

    expect(screen.getByTestId("lines")).toHaveTextContent("0");
  });

  test("an impossible quantity is repaired, never accepted", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByRole("button", { name: "add" }));

    await user.click(screen.getByRole("button", { name: "set zero" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "set negative" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    // Capped at the stock, not at the requested 999.
    await user.click(screen.getByRole("button", { name: "set huge" }));
    expect(screen.getByTestId("count")).toHaveTextContent("4");
  });

  test("removing and clearing work", async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "add" }));
    await user.click(screen.getByRole("button", { name: "add other" }));
    expect(screen.getByTestId("lines")).toHaveTextContent("2");

    await user.click(screen.getByRole("button", { name: "remove" }));
    expect(screen.getByTestId("lines")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "clear" }));
    expect(screen.getByTestId("lines")).toHaveTextContent("0");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("0");
  });

  test("the cart is persisted and restored", async () => {
    const user = userEvent.setup();
    const { unmount } = renderCart();

    await user.click(screen.getByRole("button", { name: "add" }));
    await user.click(screen.getByRole("button", { name: "add other" }));

    expect(stored()).toHaveLength(2);
    unmount();

    // A fresh provider is what a page reload produces.
    renderCart();
    expect(screen.getByTestId("lines")).toHaveTextContent("2");
    expect(screen.getByTestId("count")).toHaveTextContent("2");
  });

  test("a corrupted stored cart is discarded, not thrown", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json at all");
    expect(() => renderCart()).not.toThrow();
    expect(screen.getByTestId("lines")).toHaveTextContent("0");
  });

  test("junk entries and impossible values in storage are repaired", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        null,
        "nonsense",
        { productId: "p1", name: "Valid", price: 5, stock: 3, quantity: -2 },
        { productId: "p1", name: "Duplicate of the same product", price: 5, stock: 3, quantity: 1 },
        { name: "Missing an id", price: 1, stock: 1, quantity: 1 },
        { productId: "p9", name: "Bad numbers", price: "abc", stock: "abc", quantity: "abc" },
      ]),
    );

    renderCart();

    // Only the two entries with a usable id and name survive, deduplicated.
    expect(screen.getByTestId("lines")).toHaveTextContent("2");
    expect(screen.getByTestId("count")).toHaveTextContent("2");
  });

  test("a non-array stored value is ignored", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ productId: "p1" }));
    renderCart();
    expect(screen.getByTestId("lines")).toHaveTextContent("0");
  });

  test("only product ids and quantities are ever sent to the API", async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole("button", { name: "add" }));
    await user.click(screen.getByRole("button", { name: "add other" }));

    const orderItems = JSON.parse(screen.getByTestId("order-items").textContent);
    expect(orderItems).toEqual([
      { product: "p1", quantity: 1 },
      { product: "p2", quantity: 1 },
    ]);
    // No price, no name, no stock: the server decides all of that.
    for (const item of orderItems) {
      expect(Object.keys(item).sort()).toEqual(["product", "quantity"]);
    }
  });

  test("nothing sensitive is written to localStorage", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(screen.getByRole("button", { name: "add" }));

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toMatch(/token|jwt|password|access_token|session/i);

    // And the whole of storage holds nothing but the cart key.
    expect(Object.keys(window.localStorage)).toEqual([STORAGE_KEY]);
  });

  test("a storage write failure does not break the in-memory cart", async () => {
    const user = userEvent.setup();
    const setItem = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error("QuotaExceededError");
    };

    try {
      renderCart();
      await act(async () => {
        await user.click(screen.getByRole("button", { name: "add" }));
      });
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    } finally {
      window.localStorage.setItem = setItem;
    }
  });
});

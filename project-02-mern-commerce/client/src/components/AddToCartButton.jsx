import { useState } from "react";
import { useCart } from "../context/cart-context.js";
import "../styles/cart.css";

/**
 * Adds a product to the cart.
 *
 * Out-of-stock products cannot be added. Accepting an item is not a promise
 * that it will still be available: the server checks stock again when the
 * order is placed.
 */
function AddToCartButton({ product, quantity = 1, variant = "primary", className = "" }) {
  const { addItem, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const outOfStock = !product?.stock || product.stock <= 0;
  const inCart = items.find((item) => item.productId === product?.id);
  const atStockLimit = inCart && inCart.quantity >= product.stock;

  if (outOfStock) {
    return (
      <button type="button" className={`btn btn--secondary ${className}`.trim()} disabled>
        Nema na stanju
      </button>
    );
  }

  const handleAdd = () => {
    addItem(product, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <span className="add-to-cart">
      <button
        type="button"
        className={`btn btn--${variant} ${className}`.trim()}
        onClick={handleAdd}
        disabled={atStockLimit}
      >
        {atStockLimit ? "Sve na stanju je u korpi" : "Dodaj u korpu"}
        <span className="visually-hidden"> - {product.name}</span>
      </button>
      {/* Announced when it appears, so the addition is not conveyed visually only. */}
      <span className="add-to-cart__feedback" role="status">
        {justAdded ? "Dodano u korpu" : ""}
      </span>
    </span>
  );
}

export default AddToCartButton;

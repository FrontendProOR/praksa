import { Link } from "react-router-dom";
import Container from "../components/Container.jsx";
import ProductImage from "../components/ProductImage.jsx";
import QuantityInput from "../components/QuantityInput.jsx";
import { EmptyState } from "../components/StateViews.jsx";
import { useCart } from "../context/cart-context.js";
import { formatPrice } from "../utils/format.js";
import "../styles/cart.css";

/**
 * Cart page.
 *
 * Every amount shown here is a display figure taken from the copies stored in
 * the browser. The order is priced by the server at checkout, which is stated
 * on the page so the total is never mistaken for a final quote.
 */
function CartPage() {
  const { items, itemCount, subtotal, setQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <section className="section" aria-labelledby="korpa-naslov">
        <Container className="cart">
          <div className="cart__intro">
            <p className="eyebrow">Korpa</p>
            <h1 id="korpa-naslov">Vaša korpa</h1>
          </div>
          <EmptyState
            title="Korpa je prazna"
            message="Još niste dodali nijedan proizvod."
            action={
              <Link className="btn btn--primary" to="/products">
                Pogledaj katalog
              </Link>
            }
          />
        </Container>
      </section>
    );
  }

  return (
    <section className="section" aria-labelledby="korpa-naslov">
      <Container className="cart">
        <div className="cart__intro">
          <p className="eyebrow">Korpa</p>
          <h1 id="korpa-naslov">Vaša korpa</h1>
          <p className="lead">
            {itemCount === 1 ? "1 artikal" : `${itemCount} artikala`} u korpi.
          </p>
        </div>

        <ul className="cart__list">
          {items.map((item) => (
            <li key={item.productId} className="cart-line panel">
              <div className="cart-line__media">
                <ProductImage src={item.imageUrl} alt={item.name} ratio="1 / 1" />
              </div>

              <div className="cart-line__info">
                <h2 className="cart-line__name">
                  {item.slug ? (
                    <Link to={`/products/${item.slug}`}>{item.name}</Link>
                  ) : (
                    item.name
                  )}
                </h2>
                <p className="cart-line__unit">
                  Cijena po komadu: {formatPrice(item.price)}
                </p>
              </div>

              <div className="cart-line__quantity">
                <QuantityInput
                  id={`qty-${item.productId}`}
                  value={item.quantity}
                  max={item.stock || 99}
                  label={item.name}
                  onCommit={(quantity) => setQuantity(item.productId, quantity)}
                />
                {item.stock ? (
                  <p className="cart-line__stock">Na stanju: {item.stock}</p>
                ) : null}
              </div>

              <p className="cart-line__total">
                <span className="visually-hidden">Ukupno za {item.name}: </span>
                {formatPrice(item.price * item.quantity)}
              </p>

              <button
                type="button"
                className="btn btn--ghost cart-line__remove"
                onClick={() => removeItem(item.productId)}
              >
                Ukloni
                <span className="visually-hidden"> {item.name} iz korpe</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="cart__summary panel">
          <div className="cart__summary-row">
            <span>Međuzbir</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <p className="cart__note">
            Konačan iznos, uključujući dostavu, izračunava server prilikom
            potvrde narudžbe.
          </p>
          <div className="cart__actions">
            <Link className="btn btn--primary" to="/checkout">
              Nastavi na plaćanje
            </Link>
            <Link className="btn btn--secondary" to="/products">
              Nastavi kupovinu
            </Link>
            <button type="button" className="btn btn--ghost" onClick={clearCart}>
              Isprazni korpu
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default CartPage;

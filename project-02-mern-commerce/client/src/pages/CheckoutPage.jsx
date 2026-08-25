import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "../components/Container.jsx";
import FormField from "../components/FormField.jsx";
import { EmptyState } from "../components/StateViews.jsx";
import { describedBy } from "../utils/aria.js";
import { useCart } from "../context/cart-context.js";
import { useAuth } from "../context/auth-context.js";
import { createOrder } from "../api/orders.js";
import { formatPrice } from "../utils/format.js";
import "../styles/checkout.css";

/**
 * Checkout.
 *
 * The request carries only product ids, quantities, the shipping address and
 * the payment method. Prices and totals are the server's: the figures shown
 * here are the browser's copies, and the confirmation page shows what the
 * server actually charged.
 *
 * `card_demo` is a demonstration choice. No card details are requested or
 * stored, and no payment is processed.
 */
const EMPTY = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  postalCode: "",
  country: "Bosna i Hercegovina",
  paymentMethod: "cash_on_delivery",
};

/**
 * Turns an API failure into copy that matches the rest of the page.
 *
 * The API answers in English; these are the three refusals a customer can
 * actually hit at checkout, so they get wording in the site's language. The
 * server's own message is kept as the fallback rather than swallowed - this is
 * page copy, not a translation layer.
 */
function checkoutErrorMessage(error) {
  switch (error.code) {
    case "OUT_OF_STOCK":
      return "Nema dovoljno zaliha za jedan ili više artikala. Provjerite količine u korpi.";
    case "NOT_FOUND":
      return "Proizvod iz korpe više ne postoji. Uklonite ga iz korpe i pokušajte ponovo.";
    case "VALIDATION_ERROR":
      return "Narudžba nije prihvaćena. Provjerite unesene podatke i sadržaj korpe.";
    default:
      return error.message;
  }
}

const FIELDS = [
  { name: "fullName", label: "Ime i prezime", autoComplete: "name", max: 120 },
  { name: "phone", label: "Telefon", autoComplete: "tel", max: 40 },
  { name: "street", label: "Ulica i broj", autoComplete: "street-address", max: 160 },
  { name: "city", label: "Grad", autoComplete: "address-level2", max: 80 },
  { name: "postalCode", label: "Poštanski broj", autoComplete: "postal-code", max: 20 },
  { name: "country", label: "Država", autoComplete: "country-name", max: 80 },
];

function CheckoutPage() {
  const { items, subtotal, toOrderItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(() => ({ ...EMPTY, fullName: user?.name ?? "" }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A ref flips synchronously; state would not stop a second click in the
  // same tick, and a duplicate order is not something to leave to chance.
  const inFlightRef = useRef(false);
  const errorRef = useRef(null);

  useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);

  if (items.length === 0) {
    return (
      <section className="section" aria-labelledby="placanje-naslov">
        <Container className="checkout">
          <div className="checkout__intro">
            <p className="eyebrow">Plaćanje</p>
            <h1 id="placanje-naslov">Potvrda narudžbe</h1>
          </div>
          <EmptyState
            title="Korpa je prazna"
            message="Dodajte proizvode prije nego što nastavite na plaćanje."
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((previous) => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};
    for (const field of FIELDS) {
      const value = values[field.name].trim();
      if (!value) errors[field.name] = `${field.label} je obavezno polje.`;
      else if (value.length > field.max)
        errors[field.name] = `${field.label} može imati najviše ${field.max} znakova.`;
    }
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inFlightRef.current) return;

    setFormError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      document.getElementById(Object.keys(errors)[0])?.focus();
      return;
    }

    inFlightRef.current = true;
    setIsSubmitting(true);
    try {
      const order = await createOrder({
        items: toOrderItems(),
        shippingAddress: {
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          street: values.street.trim(),
          city: values.city.trim(),
          postalCode: values.postalCode.trim(),
          country: values.country.trim(),
        },
        paymentMethod: values.paymentMethod,
      });

      // Only once the server has accepted the order.
      clearCart();
      navigate(`/orders/${order.id}`, { replace: true, state: { justPlaced: true } });
    } catch (error) {
      // The cart is deliberately left untouched so nothing is lost.
      const details = error.details ?? [];
      if (details.length > 0) {
        setFieldErrors(
          Object.fromEntries(
            details
              .filter((detail) => detail.field?.startsWith("shippingAddress."))
              .map((detail) => [detail.field.replace("shippingAddress.", ""), detail.message]),
          ),
        );
      }
      setFormError(checkoutErrorMessage(error));
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section" aria-labelledby="placanje-naslov">
      <Container className="checkout">
        <div className="checkout__intro">
          <p className="eyebrow">Plaćanje</p>
          <h1 id="placanje-naslov">Potvrda narudžbe</h1>
          <p className="lead">
            Unesite adresu za dostavu. Konačan iznos izračunava server na osnovu
            trenutnih cijena i stanja zaliha.
          </p>
        </div>

        <div className="checkout__grid">
          <form className="checkout__form panel" onSubmit={handleSubmit} noValidate>
            {formError ? (
              <p className="checkout__error" role="alert" tabIndex={-1} ref={errorRef}>
                {formError}
              </p>
            ) : null}

            <h2 className="checkout__section-title">Adresa za dostavu</h2>

            {FIELDS.map((field) => (
              <FormField
                key={field.name}
                id={field.name}
                label={field.label}
                error={fieldErrors[field.name]}
              >
                <input
                  className="form-field__control"
                  id={field.name}
                  name={field.name}
                  type="text"
                  autoComplete={field.autoComplete}
                  maxLength={field.max}
                  required
                  value={values[field.name]}
                  onChange={handleChange}
                  aria-invalid={fieldErrors[field.name] ? "true" : undefined}
                  aria-describedby={describedBy(field.name, {
                    hasError: !!fieldErrors[field.name],
                  })}
                />
              </FormField>
            ))}

            <fieldset className="checkout__payment">
              <legend className="checkout__section-title">Način plaćanja</legend>

              <label className="checkout__radio">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={values.paymentMethod === "cash_on_delivery"}
                  onChange={handleChange}
                />
                <span>
                  Plaćanje pouzećem
                  <span className="checkout__radio-note">Plaćate kuriru pri preuzimanju.</span>
                </span>
              </label>

              <label className="checkout__radio">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card_demo"
                  checked={values.paymentMethod === "card_demo"}
                  onChange={handleChange}
                />
                <span>
                  Demo kartično plaćanje
                  <span className="checkout__radio-note">
                    Simulacija za potrebe demonstracije. Podaci o kartici se ne
                    traže niti čuvaju i nikakva naplata se ne vrši.
                  </span>
                </span>
              </label>
            </fieldset>

            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? "Slanje narudžbe..." : "Potvrdi narudžbu"}
            </button>
          </form>

          <aside className="checkout__summary panel" aria-labelledby="pregled-naslov">
            <h2 id="pregled-naslov" className="checkout__section-title">
              Pregled korpe
            </h2>
            <ul className="checkout__items">
              {items.map((item) => (
                <li key={item.productId}>
                  <span className="checkout__item-name">
                    {item.name} <span aria-hidden="true">×</span>
                    <span className="visually-hidden"> količina </span>
                    {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="checkout__summary-row">
              <span>Međuzbir (informativno)</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <p className="checkout__note">
              Dostava i konačan iznos se računaju na serveru i biće prikazani
              nakon potvrde.
            </p>
            <Link className="btn btn--ghost" to="/cart">
              Izmijeni korpu
            </Link>
          </aside>
        </div>
      </Container>
    </section>
  );
}

export default CheckoutPage;

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Container from "../components/Container.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { ErrorState, LoadingState } from "../components/StateViews.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { fetchOrder } from "../api/orders.js";
import { formatPrice } from "../utils/format.js";
import "../styles/orders.css";

const dateFormatter = new Intl.DateTimeFormat("bs-BA", { dateStyle: "long", timeStyle: "short" });

/**
 * One order.
 *
 * Everything shown comes from the order's own stored snapshot - the item name,
 * SKU and unit price as they were when the order was placed. A later change to
 * the product, or its deletion, does not rewrite this page.
 *
 * Arriving straight from checkout shows a confirmation notice; a refresh of
 * this page is a plain read and cannot create a second order.
 */
function OrderDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Captured once for this visit, then cleared from the history entry: the
  // browser keeps location state across a reload, and "your order has been
  // received" should not greet the user again every time they refresh an old
  // order. Refreshing was never able to place a second order - this is only
  // about the notice being accurate.
  const [justPlaced] = useState(location.state?.justPlaced === true);

  useEffect(() => {
    if (location.state?.justPlaced) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const { data: order, error, isLoading, reload } = useApiResource(
    ({ signal }) => fetchOrder(id, { signal }),
    [id],
  );

  if (isLoading) {
    return (
      <section className="section">
        <Container>
          <LoadingState label="Učitavanje narudžbe..." />
        </Container>
      </section>
    );
  }

  if (error) {
    const notFound = error.isNotFound;
    const forbidden = error.code === "FORBIDDEN";
    // A malformed id in the address bar is a validation failure, and the API's
    // own wording for it is English and technical. Everything the user can act
    // on is said here instead; other failures still show the server's message.
    const badId = error.code === "VALIDATION_ERROR";

    return (
      <section className="section">
        <Container className="orders">
          <ErrorState
            headingLevel={1}
            title={
              forbidden
                ? "Nemate pristup ovoj narudžbi"
                : notFound
                  ? "Narudžba nije pronađena"
                  : badId
                    ? "Neispravan broj narudžbe"
                    : "Narudžba nije učitana"
            }
            message={
              forbidden
                ? "Možete pregledati samo vlastite narudžbe."
                : notFound
                  ? "Tražena narudžba ne postoji."
                  : badId
                    ? "Adresa ne sadrži ispravan broj narudžbe. Otvorite narudžbu iz pregleda."
                    : error.message
            }
            onRetry={notFound || forbidden || badId ? undefined : reload}
          />
          <p className="orders__back">
            <Link className="btn btn--secondary" to="/orders">
              Nazad na narudžbe
            </Link>
          </p>
        </Container>
      </section>
    );
  }

  const shortId = order.id.slice(-8).toUpperCase();

  return (
    <section className="section" aria-labelledby="narudzba-naslov">
      <Container className="orders">
        {justPlaced ? (
          <p className="order-confirmation" role="status">
            <strong>Narudžba je zaprimljena.</strong> Ispod su podaci koje je
            server sačuvao, uključujući konačan iznos.
          </p>
        ) : null}

        <div className="orders__intro">
          <p className="eyebrow">Narudžba</p>
          <h1 id="narudzba-naslov">Narudžba #{shortId}</h1>
          <p className="lead">{dateFormatter.format(new Date(order.createdAt))}</p>
          <div className="order-row__badges">
            <StatusBadge status={order.orderStatus} />
            <StatusBadge status={order.paymentStatus} kind="payment" />
          </div>
        </div>

        <div className="order-detail">
          <div className="order-detail__items panel">
            <h2 className="order-detail__title">Stavke</h2>
            <ul className="order-items">
              {order.items.map((item, index) => (
                <li key={`${item.sku}-${index}`} className="order-item">
                  <div className="order-item__info">
                    <p className="order-item__name">{item.name}</p>
                    <p className="order-item__sku">Šifra: {item.sku}</p>
                  </div>
                  <p className="order-item__qty">
                    {item.quantity} <span aria-hidden="true">×</span>{" "}
                    <span className="visually-hidden">po </span>
                    {formatPrice(item.unitPrice)}
                  </p>
                  <p className="order-item__total">{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>

            <dl className="order-totals">
              <div>
                <dt>Međuzbir</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div>
                <dt>Dostava</dt>
                <dd>{order.shippingCost === 0 ? "Besplatno" : formatPrice(order.shippingCost)}</dd>
              </div>
              <div className="order-totals__grand">
                <dt>Ukupno</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="order-detail__aside">
            <div className="panel order-detail__block">
              <h2 className="order-detail__title">Adresa za dostavu</h2>
              <address className="order-address">
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.street}
                <br />
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
                <br />
                {order.shippingAddress.country}
                <br />
                {order.shippingAddress.phone}
              </address>
            </div>

            <div className="panel order-detail__block">
              <h2 className="order-detail__title">Plaćanje</h2>
              <p className="order-detail__payment">
                {order.paymentMethod === "card_demo"
                  ? "Demo kartično plaćanje (simulacija, bez stvarne naplate)"
                  : "Plaćanje pouzećem"}
              </p>
            </div>
          </div>
        </div>

        <p className="orders__back">
          <Link className="btn btn--secondary" to="/orders">
            Nazad na narudžbe
          </Link>
        </p>
      </Container>
    </section>
  );
}

export default OrderDetailsPage;

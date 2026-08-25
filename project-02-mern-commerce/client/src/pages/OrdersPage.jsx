import { Link } from "react-router-dom";
import Container from "../components/Container.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { fetchMyOrders } from "../api/orders.js";
import { formatPrice } from "../utils/format.js";
import "../styles/orders.css";

const dateFormatter = new Intl.DateTimeFormat("bs-BA", { dateStyle: "medium", timeStyle: "short" });

/** The signed-in user's order history, read from the API. */
function OrdersPage() {
  const { data: orders, error, isLoading, reload } = useApiResource(
    ({ signal }) => fetchMyOrders({ signal }),
    [],
  );

  return (
    <section className="section" aria-labelledby="narudzbe-naslov">
      <Container className="orders">
        <div className="orders__intro">
          <p className="eyebrow">Nalog</p>
          <h1 id="narudzbe-naslov">Moje narudžbe</h1>
          <p className="lead">Pregled svih narudžbi vašeg naloga.</p>
        </div>

        {isLoading ? <LoadingState label="Učitavanje narudžbi..." /> : null}

        {error ? (
          <ErrorState
            title="Narudžbe nisu učitane"
            message={error.message}
            onRetry={reload}
          />
        ) : null}

        {!isLoading && !error ? (
          orders.length === 0 ? (
            <EmptyState
              title="Nemate narudžbi"
              message="Kada napravite narudžbu, pojaviće se ovdje."
              action={
                <Link className="btn btn--primary" to="/products">
                  Pogledaj katalog
                </Link>
              }
            />
          ) : (
            <ul className="orders__list">
              {orders.map((order) => (
                <li key={order.id} className="order-row panel">
                  <div className="order-row__main">
                    <h2 className="order-row__id">
                      <Link to={`/orders/${order.id}`}>
                        Narudžba #{order.id.slice(-8).toUpperCase()}
                      </Link>
                    </h2>
                    <p className="order-row__date">{dateFormatter.format(new Date(order.createdAt))}</p>
                  </div>

                  <p className="order-row__items">
                    {order.items.length === 1 ? "1 stavka" : `${order.items.length} stavke`}
                  </p>

                  <div className="order-row__badges">
                    <StatusBadge status={order.orderStatus} />
                    <StatusBadge status={order.paymentStatus} kind="payment" />
                  </div>

                  <p className="order-row__total">
                    <span className="visually-hidden">Ukupno: </span>
                    {formatPrice(order.total)}
                  </p>

                  <Link className="btn btn--secondary order-row__link" to={`/orders/${order.id}`}>
                    Detalji
                    <span className="visually-hidden"> narudžbe #{order.id.slice(-8).toUpperCase()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </Container>
    </section>
  );
}

export default OrdersPage;

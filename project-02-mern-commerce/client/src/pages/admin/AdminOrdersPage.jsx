import { useState } from "react";
import { Link } from "react-router-dom";
import Container from "../../components/Container.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { fetchAdminOrders, updateOrderStatus } from "../../api/admin.js";
import { formatPrice } from "../../utils/format.js";
import "../../styles/orders.css";
import "../../styles/admin.css";

/**
 * Order management across all customers.
 *
 * The status control offers only the moves the server accepts from the order's
 * current status; the same rule is enforced again in the API, so a hand-built
 * request cannot take a delivered order back to pending. After a successful
 * change the row is replaced with the order the server returned, which keeps
 * the screen honest without a full reload.
 */
const dateFormatter = new Intl.DateTimeFormat("bs-BA", { dateStyle: "medium", timeStyle: "short" });

const STATUS_LABELS = {
  pending: "Na čekanju",
  processing: "U obradi",
  shipped: "Poslano",
  delivered: "Isporučeno",
  cancelled: "Otkazano",
};

/** Mirrors the server's transition map, purely so the control offers sane options. */
const NEXT_STATUSES = {
  pending: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const FILTERS = ["", "pending", "processing", "shipped", "delivered", "cancelled"];

function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, error, isLoading, reload } = useApiResource(
    ({ signal }) => fetchAdminOrders(statusFilter ? { status: statusFilter } : {}, { signal }),
    [statusFilter],
  );

  // Orders updated in this session, keyed by id, laid over the fetched list.
  const [updated, setUpdated] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [notice, setNotice] = useState(null);

  const orders = (data ?? []).map((order) => updated[order.id] ?? order);

  const handleStatusChange = async (order, nextStatus) => {
    if (!nextStatus || busyId) return;

    setBusyId(order.id);
    setUpdateError(null);
    setNotice(null);
    try {
      const saved = await updateOrderStatus(order.id, nextStatus);
      setUpdated((previous) => ({ ...previous, [saved.id]: saved }));
      setNotice(
        `Narudžba #${saved.id.slice(-8).toUpperCase()} je sada "${STATUS_LABELS[saved.orderStatus]}".`,
      );
    } catch (requestError) {
      setUpdateError(`#${order.id.slice(-8).toUpperCase()}: ${requestError.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="section" aria-labelledby="narudzbe-admin-naslov">
      <Container>
        <div className="admin__intro">
          <p className="eyebrow">Administracija</p>
          <h1 id="narudzbe-admin-naslov">Narudžbe</h1>
          <p className="lead">Sve narudžbe u sistemu, najnovije prve.</p>
        </div>

        <div className="admin__filter">
          <label className="admin__filter-label" htmlFor="status-filter">
            Status
          </label>
          <select
            id="status-filter"
            className="form-field__control"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setNotice(null);
              setUpdateError(null);
            }}
          >
            {FILTERS.map((value) => (
              <option key={value || "all"} value={value}>
                {value ? STATUS_LABELS[value] : "Svi statusi"}
              </option>
            ))}
          </select>
        </div>

        {notice ? (
          <p className="admin__notice" role="status">
            {notice}
          </p>
        ) : null}

        {updateError ? (
          <p className="admin-form__error" role="alert">
            {updateError}
          </p>
        ) : null}

        {isLoading ? <LoadingState label="Učitavanje narudžbi..." /> : null}

        {error ? (
          <ErrorState title="Narudžbe nisu učitane" message={error.message} onRetry={reload} />
        ) : null}

        {!isLoading && !error ? (
          orders.length === 0 ? (
            <EmptyState
              title="Nema narudžbi"
              message={
                statusFilter
                  ? "Nijedna narudžba nema izabrani status."
                  : "Kada kupci naprave narudžbu, pojaviće se ovdje."
              }
            />
          ) : (
            <ul className="orders__list">
              {orders.map((order) => {
                const reference = `#${order.id.slice(-8).toUpperCase()}`;
                const options = NEXT_STATUSES[order.orderStatus] ?? [];
                const selectId = `status-${order.id}`;

                return (
                  <li key={order.id} className="order-row order-row--admin panel">
                    <div className="order-row__main">
                      <h2 className="order-row__id">
                        <Link to={`/orders/${order.id}`}>Narudžba {reference}</Link>
                      </h2>
                      <p className="order-row__date">
                        {dateFormatter.format(new Date(order.createdAt))}
                      </p>
                      <p className="order-row__customer">
                        {order.user?.name ?? "Nepoznat kupac"}
                        {order.user?.email ? ` · ${order.user.email}` : ""}
                      </p>
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

                    <div className="order-row__status-control">
                      <label className="visually-hidden" htmlFor={selectId}>
                        Promijeni status narudžbe {reference}
                      </label>
                      {options.length === 0 ? (
                        <p className="order-row__final">Konačan status</p>
                      ) : (
                        <select
                          id={selectId}
                          className="form-field__control"
                          value=""
                          disabled={busyId === order.id}
                          onChange={(event) => handleStatusChange(order, event.target.value)}
                        >
                          <option value="">Promijeni status...</option>
                          {options.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
      </Container>
    </section>
  );
}

export default AdminOrdersPage;

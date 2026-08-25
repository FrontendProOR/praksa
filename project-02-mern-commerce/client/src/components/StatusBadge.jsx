import "../styles/orders.css";

/**
 * Order and payment status badges.
 *
 * The label is the meaning; colour only reinforces it, so the state is still
 * clear without seeing the colour.
 */
const ORDER_STATUS = {
  pending: { label: "Na čekanju", tone: "pending" },
  processing: { label: "U obradi", tone: "processing" },
  shipped: { label: "Poslano", tone: "shipped" },
  delivered: { label: "Isporučeno", tone: "delivered" },
  cancelled: { label: "Otkazano", tone: "cancelled" },
};

const PAYMENT_STATUS = {
  pending: { label: "Plaćanje na čekanju", tone: "pending" },
  paid_demo: { label: "Plaćeno (demo)", tone: "delivered" },
  failed: { label: "Plaćanje neuspješno", tone: "cancelled" },
};

function StatusBadge({ status, kind = "order" }) {
  const map = kind === "payment" ? PAYMENT_STATUS : ORDER_STATUS;
  const entry = map[status] ?? { label: status, tone: "pending" };

  return <span className={`status-badge status-badge--${entry.tone}`}>{entry.label}</span>;
}

export default StatusBadge;

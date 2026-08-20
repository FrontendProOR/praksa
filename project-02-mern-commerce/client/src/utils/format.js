/** Shared formatting helpers. */

const priceFormatter = new Intl.NumberFormat("bs-BA", {
  style: "currency",
  currency: "BAM",
  minimumFractionDigits: 2,
});

/**
 * @param {number} value
 * @returns {string} price formatted in the local currency
 */
export function formatPrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return priceFormatter.format(value);
}

/**
 * Describes availability from the stock count.
 *
 * @param {number} stock
 * @returns {{ label: string, tone: "in-stock"|"low"|"out" }}
 */
export function describeStock(stock) {
  if (!Number.isFinite(stock) || stock <= 0) {
    return { label: "Nema na stanju", tone: "out" };
  }
  if (stock <= 5) {
    return { label: `Posljednji komadi (${stock})`, tone: "low" };
  }
  return { label: "Na stanju", tone: "in-stock" };
}

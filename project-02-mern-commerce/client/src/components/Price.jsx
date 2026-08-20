import { formatPrice } from "../utils/format.js";
import "../styles/price.css";

/**
 * Price display.
 *
 * When a compare-at price is present it is shown struck through next to the
 * current price, with a screen-reader label so the relationship is not
 * conveyed by styling alone.
 */
function Price({ value, compareAtValue, size = "md" }) {
  const hasComparison = typeof compareAtValue === "number" && compareAtValue > value;

  return (
    <p className={`price price--${size}`}>
      <span className="price__current">{formatPrice(value)}</span>
      {hasComparison ? (
        <>
          <span className="visually-hidden">, prethodna cijena</span>
          <s className="price__compare">{formatPrice(compareAtValue)}</s>
        </>
      ) : null}
    </p>
  );
}

export default Price;

import { useState } from "react";
import "../styles/cart.css";

/**
 * Quantity control for a cart line.
 *
 * The field keeps whatever is being typed - including an empty box mid-edit -
 * and only commits when editing finishes (blur or Enter). Normalising on every
 * keystroke would make the field fight the user: clearing it would snap back
 * to 1, and typing "35" would be read as 3, then 35, then clamped.
 *
 * On commit the value is repaired rather than rejected: anything below 1, not
 * a number, or above the known stock becomes the nearest sensible quantity.
 * That stock figure is a display guard only - the server checks stock again
 * when the order is placed.
 */
function QuantityInput({ id, value, max, label, onCommit }) {
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);

  // Adopt a value changed elsewhere (another control, a fresh page render).
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  const commit = () => {
    const parsed = Math.trunc(Number(draft));
    const safe = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
    const capped = max ? Math.min(safe, max) : safe;
    setDraft(String(capped));
    setLastValue(capped);
    onCommit(capped);
  };

  return (
    <>
      <label className="cart-line__label" htmlFor={id}>
        Količina
        <span className="visually-hidden"> - {label}</span>
      </label>
      <input
        id={id}
        className="cart-line__input"
        type="number"
        inputMode="numeric"
        min="1"
        max={max || undefined}
        step="1"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
      />
    </>
  );
}

export default QuantityInput;

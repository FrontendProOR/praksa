import Button from "./Button.jsx";
import "../styles/state-views.css";

/**
 * The three states every API-backed view needs.
 *
 * They are kept together because they are always used as a set, and sharing
 * one stylesheet keeps them visually consistent.
 */

/**
 * Loading state.
 *
 * `role="status"` + `aria-live="polite"` announce it to screen readers, and
 * the skeleton blocks are decorative so they are hidden from them.
 */
export function LoadingState({ label = "Učitavanje...", skeletonCount = 0 }) {
  return (
    <div className="state-view" role="status" aria-live="polite">
      <p className="state-view__loading-text">{label}</p>
      {skeletonCount > 0 ? (
        <ul className="skeleton-grid" aria-hidden="true">
          {Array.from({ length: skeletonCount }, (_, index) => (
            <li key={index} className="skeleton-card">
              <span className="skeleton-card__media" />
              <span className="skeleton-card__line" />
              <span className="skeleton-card__line skeleton-card__line--short" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Error state.
 *
 * The message is text, never colour alone, and `role="alert"` makes it
 * announced. `onRetry` is optional - it is only shown when retrying makes
 * sense for the caller.
 */
export function ErrorState({ title = "Došlo je do greške", message, onRetry }) {
  return (
    <div className="state-view state-view--error" role="alert">
      <span className="state-view__icon state-view__icon--error" aria-hidden="true" />
      <h2 className="state-view__title">{title}</h2>
      {message ? <p className="state-view__message">{message}</p> : null}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Pokušaj ponovo
        </Button>
      ) : null}
    </div>
  );
}

/** Empty state: the request succeeded, there was simply nothing to show. */
export function EmptyState({ title = "Nema rezultata", message, action = null }) {
  return (
    <div className="state-view">
      <span className="state-view__icon" aria-hidden="true" />
      <h2 className="state-view__title">{title}</h2>
      {message ? <p className="state-view__message">{message}</p> : null}
      {action}
    </div>
  );
}

import "../styles/pagination.css";

/**
 * Pagination driven by the API's `meta`.
 *
 * Every page change re-requests that page from the API - nothing slices an
 * already-loaded array, so the numbers always match what the server returns.
 *
 * Boundary controls are real `disabled` buttons, so they are not focusable and
 * cannot be activated by keyboard or pointer. The current page is marked with
 * `aria-current="page"`.
 */

/**
 * Page numbers to render: always the first and last page, plus a window around
 * the current one, with gaps collapsed so the row stays short on a phone.
 *
 * @returns {Array<number|"gap">}
 */
function pageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const items = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) items.push("gap");
    items.push(page);
    previous = page;
  }
  return items;
}

function Pagination({ meta, onPageChange }) {
  const { page, totalPages } = meta;

  // Nothing to paginate through.
  if (!totalPages || totalPages <= 1) return null;

  const items = pageItems(page, totalPages);

  return (
    <nav className="pagination" aria-label="Stranice kataloga">
      <button
        type="button"
        className="pagination__step"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <span aria-hidden="true">&larr;</span> Prethodna
      </button>

      <ol className="pagination__pages">
        {items.map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} className="pagination__gap" aria-hidden="true">
              &hellip;
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={`pagination__page${item === page ? " pagination__page--current" : ""}`}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                <span className="visually-hidden">Stranica </span>
                {item}
              </button>
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        className="pagination__step"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Sljedeća <span aria-hidden="true">&rarr;</span>
      </button>
    </nav>
  );
}

export default Pagination;

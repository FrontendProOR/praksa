import { SORT_OPTIONS } from "../utils/catalogQuery.js";
import "../styles/catalog-controls.css";

/**
 * Catalogue filters: category, featured-only and sort order.
 *
 * Category options come from the API, so they can never drift from what is in
 * MongoDB, and the values sent are the real category slugs. Sort values are
 * exactly the five the API accepts.
 *
 * Native <select> and <input type="checkbox"> are used deliberately: they are
 * already labelled, keyboard operable and announce their own state, so no ARIA
 * is layered on top.
 */
function FilterPanel({
  params,
  categories,
  categoriesLoading,
  categoriesError,
  onChange,
  onReset,
  canReset,
}) {
  return (
    <div className="filter-panel">
      <div className="filter-panel__field">
        <label className="filter-panel__label" htmlFor="catalog-category">
          Kategorija
        </label>
        <select
          id="catalog-category"
          className="filter-panel__control"
          value={params.category}
          disabled={categoriesLoading || Boolean(categoriesError)}
          onChange={(event) => onChange({ category: event.target.value })}
        >
          <option value="">Sve kategorije</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        {categoriesError ? (
          <p className="filter-panel__note">Kategorije nisu učitane.</p>
        ) : null}
      </div>

      <div className="filter-panel__field">
        <label className="filter-panel__label" htmlFor="catalog-sort">
          Sortiranje
        </label>
        <select
          id="catalog-sort"
          className="filter-panel__control"
          value={params.sort}
          onChange={(event) => onChange({ sort: event.target.value })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-panel__field filter-panel__field--inline">
        <input
          id="catalog-featured"
          className="filter-panel__checkbox"
          type="checkbox"
          checked={params.featured}
          onChange={(event) => onChange({ featured: event.target.checked })}
        />
        <label htmlFor="catalog-featured">Samo izdvojeni proizvodi</label>
      </div>

      {canReset ? (
        <button type="button" className="btn btn--ghost filter-panel__reset" onClick={onReset}>
          Poništi sve filtere
        </button>
      ) : null}
    </div>
  );
}

export default FilterPanel;

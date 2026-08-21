/**
 * The single definition of catalogue query state.
 *
 * The URL is the authoritative store for the catalogue controls, so parsing,
 * sanitising and serialising all live here. Components and the API module both
 * use these helpers instead of assembling query strings themselves.
 *
 * Sanitising mirrors the API: an unsupported sort falls back to `newest` and a
 * bad page falls back to 1, so a hand-edited URL can never break the page.
 */

export const SORT_OPTIONS = [
  { value: "newest", label: "Najnovije" },
  { value: "price_asc", label: "Cijena: od najniže" },
  { value: "price_desc", label: "Cijena: od najviše" },
  { value: "name_asc", label: "Naziv: A-Ž" },
  { value: "name_desc", label: "Naziv: Ž-A" },
];

export const DEFAULT_CATALOG_STATE = Object.freeze({
  q: "",
  category: "",
  sort: "newest",
  featured: false,
  page: 1,
});

const SORT_VALUES = SORT_OPTIONS.map((option) => option.value);

/** Controls that describe *what* is listed; changing any of them resets paging. */
export const FILTER_KEYS = ["q", "category", "sort", "featured"];

/**
 * Reads catalogue state out of URLSearchParams, repairing anything invalid.
 *
 * @param {URLSearchParams} searchParams
 * @returns {{ q: string, category: string, sort: string, featured: boolean, page: number }}
 */
export function parseCatalogParams(searchParams) {
  const rawPage = Number.parseInt(searchParams.get("page") ?? "", 10);
  const rawSort = searchParams.get("sort") ?? "";

  return {
    q: (searchParams.get("q") ?? "").trim(),
    category: (searchParams.get("category") ?? "").trim(),
    sort: SORT_VALUES.includes(rawSort) ? rawSort : DEFAULT_CATALOG_STATE.sort,
    featured: searchParams.get("featured") === "true",
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : DEFAULT_CATALOG_STATE.page,
  };
}

/**
 * Serialises catalogue state for the address bar.
 *
 * Values equal to the default are omitted, so the tidy URL is `/products` and
 * only the controls the user actually changed appear.
 *
 * @param {object} state
 * @returns {URLSearchParams}
 */
export function toSearchParams(state) {
  const params = new URLSearchParams();

  if (state.q) params.set("q", state.q);
  if (state.category) params.set("category", state.category);
  if (state.sort && state.sort !== DEFAULT_CATALOG_STATE.sort) params.set("sort", state.sort);
  if (state.featured) params.set("featured", "true");
  if (state.page && state.page > 1) params.set("page", String(state.page));

  return params;
}

/**
 * Builds the parameter object sent to `GET /api/products`.
 *
 * Only the parameters the API documents are ever sent, and defaults are left
 * out so the request stays minimal. Axios encodes the values.
 *
 * @param {object} state
 * @returns {object}
 */
export function toApiParams(state) {
  const params = {};

  if (state.q) params.q = state.q;
  if (state.category) params.category = state.category;
  if (state.sort && state.sort !== DEFAULT_CATALOG_STATE.sort) params.sort = state.sort;
  if (state.featured) params.featured = true;
  if (state.page && state.page > 1) params.page = state.page;

  return params;
}

/** True when nothing is filtered, sorted or paged away from the defaults. */
export function isDefaultCatalogState(state) {
  return (
    !state.q &&
    !state.category &&
    !state.featured &&
    state.sort === DEFAULT_CATALOG_STATE.sort &&
    state.page === DEFAULT_CATALOG_STATE.page
  );
}

/** True when any control that narrows the result set is active. */
export function hasActiveFilters(state) {
  return Boolean(state.q || state.category || state.featured);
}

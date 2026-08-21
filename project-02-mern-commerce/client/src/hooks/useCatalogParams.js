import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_CATALOG_STATE,
  FILTER_KEYS,
  parseCatalogParams,
  toSearchParams,
} from "../utils/catalogQuery.js";

/**
 * Catalogue state held in the URL.
 *
 * There is no second copy of this state in React: the address bar is the
 * single source of truth, which is what makes refresh, Back/Forward and shared
 * links work without any synchronising effect (and without the loops such an
 * effect tends to cause).
 *
 * @returns {{
 *   params: object,
 *   setFilters: (patch: object) => void,
 *   setPage: (page: number) => void,
 *   reset: () => void,
 * }}
 */
export function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Re-parsed only when the query string actually changes, so the object
  // identity is stable enough to drive a fetch effect.
  const params = useMemo(
    () => parseCatalogParams(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the string is the real dependency
    [searchParams.toString()],
  );

  /**
   * Applies a change to one or more filters.
   *
   * Any filter change drops paging back to the first page: staying on page 4
   * of a result set that no longer has four pages would show an empty screen.
   */
  const setFilters = useCallback(
    (patch) => {
      const next = { ...parseCatalogParams(searchParams), ...patch };
      const changedFilter = FILTER_KEYS.some((key) => key in patch);
      if (changedFilter) next.page = DEFAULT_CATALOG_STATE.page;
      setSearchParams(toSearchParams(next));
    },
    [searchParams, setSearchParams],
  );

  /** Page changes keep every other control untouched. */
  const setPage = useCallback(
    (page) => {
      const next = { ...parseCatalogParams(searchParams), page };
      setSearchParams(toSearchParams(next));
    },
    [searchParams, setSearchParams],
  );

  const reset = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams]);

  return { params, setFilters, setPage, reset };
}

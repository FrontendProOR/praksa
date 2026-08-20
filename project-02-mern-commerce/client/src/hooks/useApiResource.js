import { useCallback, useEffect, useState } from "react";

/**
 * Runs an API call and tracks its loading / error / data state.
 *
 * Used by every page that reads from the API, so the three states are handled
 * the same way everywhere.
 *
 * The request is aborted when the component unmounts or the dependencies
 * change, and a late response from an aborted request is ignored - so a fast
 * navigation cannot overwrite the newer view with stale data.
 *
 * @param {(options: { signal: AbortSignal }) => Promise<any>} request
 * @param {Array} deps values that should trigger a refetch when they change
 * @returns {{ data: any, error: Error|null, isLoading: boolean, reload: () => void }}
 */
export function useApiResource(request, deps = []) {
  const [state, setState] = useState({ data: null, error: null, isLoading: true });
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((previous) => ({ ...previous, isLoading: true, error: null }));

    request({ signal: controller.signal })
      .then((data) => {
        if (active) setState({ data, error: null, isLoading: false });
      })
      .catch((error) => {
        // An abort is a deliberate cancellation, not a failure to report.
        if (!active || controller.signal.aborted) return;
        setState({ data: null, error, isLoading: false });
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns the dependency list
  }, [...deps, reloadToken]);

  return { ...state, reload };
}

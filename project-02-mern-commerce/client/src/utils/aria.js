/** Small helpers for wiring ARIA relationships on form controls. */

/**
 * Builds the `aria-describedby` value for a control, referencing whichever of
 * its help text and error message are currently rendered.
 *
 * @param {string} id the control's id
 * @param {{ hasHelp?: boolean, hasError?: boolean }} flags
 * @returns {string|undefined}
 */
export function describedBy(id, { hasHelp = false, hasError = false } = {}) {
  const ids = [];
  if (hasHelp) ids.push(`${id}-help`);
  if (hasError) ids.push(`${id}-error`);
  return ids.length ? ids.join(" ") : undefined;
}

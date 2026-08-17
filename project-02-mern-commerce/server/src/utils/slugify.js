/**
 * Slug helper shared by the Category and Product models.
 *
 * Slugs must be normalised consistently wherever they are produced, so both
 * models call this function from a pre-validate hook instead of trusting the
 * value that arrives from the client.
 */

/** Combining marks left behind by NFD normalisation. */
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Turns a string into a lowercase, URL-safe slug.
 *
 * Latin letters with diacritics used in local product names (č, ć, ž, š, đ)
 * are transliterated so the slug stays readable ASCII. "đ" has no decomposed
 * form, so it is replaced explicitly.
 *
 * @param {string} value
 * @returns {string} slug, or an empty string when nothing usable remains
 */
export function slugify(value) {
  if (typeof value !== "string") return "";

  return value
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

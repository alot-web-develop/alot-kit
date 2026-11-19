import { isEmptyString, isNonNegativeSafeInteger } from "./guards.js";

/**
 * Normalizes text for accent-insensitive searching: NFKD decomposition,
 * lowercase (per locale), combining-mark removal, and whitespace collapsing.
 * This is not a linguistic transliterator.
 *
 * @param value - The string to normalize.
 * @param locale - Locale used for lowercasing.
 * @returns The normalized string.
 */
export function normalizeText(value: string, locale?: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase(locale)
    .replace(/\p{M}/gu, "")
    .trim()
    .replace(/\s+/gu, " ");
}

/**
 * Produces a URL slug: normalized, with non-alphanumeric runs replaced by a
 * single hyphen and leading/trailing hyphens removed.
 *
 * @param value - The string to slugify.
 * @returns The slugified string.
 */
export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Truncates a string to a maximum length, appending a suffix when shortened.
 * Length is measured in Unicode code points and includes the suffix.
 *
 * @param value - The string to truncate.
 * @param maxLength - Maximum code point length (nonnegative safe integer).
 * @param suffix - Suffix appended to truncated strings (defaults to `…`).
 * @returns The original string when within bounds, otherwise the truncated form.
 */
export function truncate(
  value: string,
  maxLength: number,
  suffix = "…",
): string {
  if (!isNonNegativeSafeInteger(maxLength)) {
    throw new RangeError("maxLength must be a nonnegative safe integer");
  }
  const chars = Array.from(value);
  if (chars.length <= maxLength) return value;
  const ending = Array.from(suffix).slice(0, maxLength);
  return chars.slice(0, maxLength - ending.length).join("") + ending.join("");
}

/** Trims a nullable string, returning undefined when nothing remains. */
export function trimToUndefined(
  value: string | null | undefined,
): string | undefined {
  const trimmed = value?.trim();
  return isEmptyString(trimmed) ? undefined : trimmed;
}

/** Trims a nullable string, returning null when nothing remains. */
export function trimToNull(value: string | null | undefined): string | null {
  return trimToUndefined(value) ?? null;
}

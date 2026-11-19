import { type DateInput, parseDate } from "./dates.js";
import { isBlankOrEmpty, isEmptyArray, isNullOrUndefined } from "./guards.js";
import { normalizeText } from "./strings.js";

export type Predicate<T> = (value: T) => boolean;
export type Range<T> = { min?: T; max?: T };
export type SearchValue = string | number | boolean | null | undefined;

/**
 * Case- and accent-insensitive substring match for a single searchable value.
 *
 * @param value - The value to test; nullish values never match a non-empty query.
 * @param query - The normalized search query.
 * @param locale - Locale used for normalization (see {@link normalizeText}).
 * @returns `true` for an empty query, or when `value` contains the query.
 */
export function matchesSearch(
  value: SearchValue,
  query: string,
  locale?: string,
): boolean {
  const search = normalizeText(query, locale);
  if (search === "") return true;
  if (isNullOrUndefined(value)) return false;
  return normalizeText(String(value), locale).includes(search);
}

/**
 * Filters items whose searchable values match a query.
 *
 * @param items - The items to filter.
 * @param query - The search query; an empty query matches everything.
 * @param getValues - Extracts searchable values from an item.
 * @param locale - Locale used for normalization.
 * @returns Items matching the query.
 */
export function filterBySearch<T>(
  items: readonly T[],
  query: string,
  getValues: (item: T) => readonly SearchValue[],
  locale?: string,
): T[] {
  const search = normalizeText(query, locale);
  if (search === "") return [...items];
  return items.filter((item) =>
    getValues(item).some((value) => matchesSearch(value, search, locale)),
  );
}

/** Returns `true` when no selection is active or `value` is selected. */
export function matchesSelection<T>(value: T, selected: readonly T[]): boolean {
  return selected.length === 0 || selected.includes(value);
}

/**
 * Tests whether a finite number falls within inclusive bounds. Bounds must be
 * finite and ordered; an invalid candidate returns `false`.
 *
 * @param value - The number to test.
 * @param param.min - Inclusive lower bound (optional).
 * @param param.max - Inclusive upper bound (optional).
 * @returns `true` when `value` is finite and within both bounds.
 */
export function isInNumberRange(
  value: number,
  { min, max }: Range<number>,
): boolean {
  if (min !== undefined && !Number.isFinite(min)) {
    throw new RangeError("Expected finite, ordered bounds");
  }
  if (max !== undefined && !Number.isFinite(max)) {
    throw new RangeError("Expected finite, ordered bounds");
  }
  if (min !== undefined && max !== undefined && min > max) {
    throw new RangeError("Expected finite, ordered bounds");
  }
  const withinMin = min === undefined || value >= min;
  const withinMax = max === undefined || value <= max;
  return Number.isFinite(value) && withinMin && withinMax;
}

/**
 * Tests whether a date falls within inclusive instant bounds, compared in
 * milliseconds. Invalid candidates return `false`; invalid bounds throw.
 *
 * @param value - The date to test.
 * @param param.min - Inclusive lower bound (optional).
 * @param param.max - Inclusive upper bound (optional).
 * @returns `true` when `value` is valid and within both bounds.
 */
export function isInDateRange(
  value: DateInput,
  { min, max }: Range<DateInput>,
): boolean {
  const parseBound = (bound: DateInput | undefined): number | undefined =>
    bound === undefined ? undefined : parseDate(bound).valueOf();

  const bounds = { min: parseBound(min), max: parseBound(max) };
  // Validate bounds even if the candidate is invalid.
  isInNumberRange(0, bounds);

  let timestamp: number;
  try {
    timestamp = parseDate(value).valueOf();
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) return false;
    throw error;
  }
  return isInNumberRange(timestamp, bounds);
}

/** Combines predicates with logical AND: matches only when all pass. */
export const allOf =
  <T>(...predicates: readonly Predicate<T>[]): Predicate<T> =>
  (value) =>
    predicates.every((predicate) => predicate(value));

/** Combines predicates with logical OR: matches when at least one passes. */
export const anyOf =
  <T>(...predicates: readonly Predicate<T>[]): Predicate<T> =>
  (value) =>
    predicates.some((predicate) => predicate(value));

/** Negates a predicate: matches when the original predicate returns `false`. */
export const not =
  <T>(predicate: Predicate<T>): Predicate<T> =>
  (value) =>
    !predicate(value);

/**
 * Removes empty/blank/empty-array entries from a filter object while retaining
 * meaningful falsy values such as `0` and `false`.
 *
 * @param filters - The filter object to compact.
 * @returns A shallow copy with nullish, blank-string, and empty-array entries removed.
 */
export function compactFilters<T extends Record<string, unknown>>(
  filters: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => !isBlankOrEmpty(value) && !isEmptyArray(value),
    ),
  ) as Partial<T>;
}

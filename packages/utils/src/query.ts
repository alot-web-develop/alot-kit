import { isNullOrUndefined, isScalar } from "./guards.js";

export type QueryScalar = string | number | boolean | null | undefined;
export type QueryValue = QueryScalar | readonly QueryScalar[];
export type QueryRecord = Readonly<Record<string, QueryValue>>;

/**
 * Serializes scalar values into a `URLSearchParams`. Arrays repeat the key;
 * nullish entries are omitted; non-finite numbers and non-scalar values throw.
 *
 * @param values - Flat key/value record to serialize.
 * @returns The resulting search params.
 */
export function toSearchParams(values: QueryRecord): URLSearchParams {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (isNullOrUndefined(item)) continue;
      if (!isScalar(item)) {
        throw new TypeError(
          "Query values must be scalars or arrays of scalars",
        );
      }
      if (typeof item === "number" && !Number.isFinite(item))
        throw new RangeError("Expected a finite query number");
      result.append(key, String(item));
    }
  }
  return result;
}

/** Arrays of strings in a null-prototype dictionary. Accepts a query, not a full URL. */
/**
 * Parses a query string into a null-prototype dictionary of string arrays.
 * Accepts a raw query (not a full URL) or an existing `URLSearchParams`.
 *
 * @param input - Query string or search params.
 * @returns A null-prototype map of key to repeated values.
 */
export function fromSearchParams(
  input: string | URLSearchParams,
): Record<string, string[]> {
  const result = Object.create(null) as Record<string, string[]>;
  for (const [key, value] of new URLSearchParams(input)) {
    result[key] ??= [];
    result[key].push(value);
  }
  return result;
}

/** Clone, then replace supplied keys. Nullish values and empty arrays delete a key. */
/**
 * Clones existing search params and replaces the supplied keys. Nullish
 * values and empty arrays delete the key entirely.
 *
 * @param input - Existing query string or search params.
 * @param changes - Keys to replace.
 * @returns A new `URLSearchParams` with the changes applied.
 */
export function updateSearchParams(
  input: string | URLSearchParams,
  changes: QueryRecord,
): URLSearchParams {
  const result = new URLSearchParams(input);
  const additions = toSearchParams(changes);
  for (const key of Object.keys(changes)) result.delete(key);
  for (const [key, value] of additions) result.append(key, value);
  return result;
}

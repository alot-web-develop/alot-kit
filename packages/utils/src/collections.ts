// Selected native es-toolkit APIs. Keep upstream names and semantics.
export {
  chunk,
  compact,
  orderBy,
  partition,
  sortBy,
  uniqBy,
} from "es-toolkit/array";
export { omit } from "es-toolkit/object";

// These small adapters deliberately use safe data properties. Upstream's assignment to
// {} treats __proto__ as a setter, losing that key and changing the result's prototype.
/**
 * Groups items into a null-prototype dictionary keyed by a computed value.
 *
 * @param items - The items to group.
 * @param getKey - Produces each item's group key.
 * @returns A null-prototype map of keys to their items.
 */
export function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  getKey: (item: T, index: number, items: readonly T[]) => K,
): Partial<Record<K, T[]>> {
  const result = Object.create(null) as Partial<Record<K, T[]>>;
  items.forEach((item, index) => {
    const key = getKey(item, index, items);
    result[key] ??= [];
    result[key].push(item);
  });
  return result;
}

/**
 * Indexes items into a dictionary by a computed key. When keys collide, the
 * last item wins; missing keys are `undefined`.
 *
 * @param items - The items to index.
 * @param getKey - Produces each item's key.
 * @returns A map of keys to their items.
 */
export function keyBy<T, K extends PropertyKey>(
  items: readonly T[],
  getKey: (item: T, index: number, items: readonly T[]) => K,
): Partial<Record<K, T>> {
  return Object.fromEntries(
    items.map((item, index) => [getKey(item, index, items), item]),
  ) as Partial<Record<K, T>>;
}

/**
 * Picks a subset of own keys (including non-enumerable/symbol keys) from an
 * object, omitting keys that are not present.
 *
 * @param object - The source object.
 * @param keys - The keys to pick.
 * @returns A new object with only the selected keys.
 */
export function pick<T extends object, K extends keyof T>(
  object: T,
  keys: readonly K[],
): Pick<T, K> {
  return Object.fromEntries(
    keys
      .filter((key) => Object.hasOwn(object, key))
      .map((key) => [key, object[key]]),
  ) as Pick<T, K>;
}

export { isDefined } from "./guards.js";

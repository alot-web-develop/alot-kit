/**
 * Low-level value predicates shared across the utility modules. These are
 * framework-agnostic and return type predicates where the result can narrow
 * the input for the type system.
 */

import { isBoolean, isNumber, isString } from "es-toolkit/predicate";

// Keep primitive type checks consistent with the existing es-toolkit dependency.
export {
  isBoolean,
  isFunction,
  isNull,
  isNumber,
  isPlainObject,
  isPrimitive,
  isString,
  isUndefined,
} from "es-toolkit/predicate";

/**
 * Checks whether a value is `null` or `undefined`.
 *
 * @param value - Value to check.
 * @returns `true` when the value is nullish.
 */
export const isNullOrUndefined = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

/**
 * Checks whether a value is neither `null` nor `undefined`.
 *
 * @param value - Value to check.
 * @returns `true` when the value is defined.
 */
export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

/**
 * Checks whether a string is `null`, `undefined`, or empty.
 *
 * @param value - Value to check.
 * @returns `true` when the value is nullish or the empty string.
 */
export const isEmptyString = (value: unknown): value is null | undefined | "" =>
  isNullOrUndefined(value) || value === "";

/**
 * Checks whether a string is nullish, empty, or contains only whitespace.
 * Returns a boolean because whitespace-only strings cannot be represented by
 * the empty string literal type.
 *
 * @param value - Value to check.
 * @returns `true` when the value is blank after trimming.
 */
export const isBlankOrEmpty = (value: unknown): boolean =>
  isEmptyString(value) || (isString(value) && value.trim() === "");

/** True for strings with at least one character; whitespace counts. No coercion. */
export const isNonEmptyString = (value: unknown): boolean =>
  isString(value) && value.length > 0;

/** True for strings with at least one non-whitespace character. No coercion. */
export const isNonBlankString = (value: unknown): boolean =>
  isString(value) && value.trim().length > 0;

/** Checks for an array, preserving readonly input types and unknown element types. */
export const isArray = (value: unknown): value is readonly unknown[] =>
  Array.isArray(value);

/** True only for zero-length arrays. Nullish values and other types return false. */
export const isEmptyArray = (value: unknown): value is readonly [] =>
  isArray(value) && value.length === 0;

/**
 * Checks for an array with at least one position, preserving its element type.
 * Length is checked; elements are not validated and sparse arrays are accepted.
 */
export function isNonEmptyArray<T>(
  value: readonly T[] | null | undefined,
): value is readonly [T, ...T[]];
export function isNonEmptyArray(
  value: unknown,
): value is readonly [unknown, ...unknown[]];
export function isNonEmptyArray(
  value: unknown,
): value is readonly [unknown, ...unknown[]] {
  return isArray(value) && value.length > 0;
}

/**
 * Checks whether a value is a non-null, non-array object. Class instances,
 * dates, maps, and null-prototype objects are accepted; this does not validate
 * an object's fields or restrict its prototype.
 *
 * @param value - Value to check.
 * @returns `true` when the value is a non-null, non-array object.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Checks whether a value is a string, number, or boolean primitive. Numbers
 * include NaN and infinities; use `isFiniteNumber` when finiteness is required.
 *
 * @param value - Value to check.
 * @returns `true` when the value is a string, number, or boolean.
 */
export const isScalar = (value: unknown): value is string | number | boolean =>
  isString(value) || isNumber(value) || isBoolean(value);

/**
 * Checks whether a number is finite.
 *
 * @param value - Value to check.
 * @returns `true` when the value is a finite number.
 */
export const isFiniteNumber = (value: unknown): value is number =>
  isNumber(value) && Number.isFinite(value);

/** Checks for integer numbers without coercion; NaN and infinities return false. */
export const isInteger = (value: unknown): boolean => Number.isInteger(value);

/** Checks for integers in JavaScript's safe integer range, without coercion. */
export const isSafeInteger = (value: unknown): boolean =>
  Number.isSafeInteger(value);

/**
 * Checks whether a number is a nonnegative safe integer.
 *
 * @param value - Value to check.
 * @returns `true` when the value is a nonnegative safe integer.
 */
export const isNonNegativeSafeInteger = (value: unknown): value is number =>
  isNumber(value) && isSafeInteger(value) && value >= 0;

import { expect, expectTypeOf, test } from "vitest";
import * as guards from "../src/guards.js";

test("isNullOrUndefined narrows nullish values", () => {
  expect(guards.isNullOrUndefined(null)).toBe(true);
  expect(guards.isNullOrUndefined(undefined)).toBe(true);
  expect(guards.isNullOrUndefined(0)).toBe(false);
  expect(guards.isNullOrUndefined("")).toBe(false);
  expect(guards.isNullOrUndefined(false)).toBe(false);
});

test.each([
  {
    name: "isNull",
    check: guards.isNull,
    yes: [null],
    no: [undefined, 0, false, ""],
  },
  {
    name: "isUndefined",
    check: guards.isUndefined,
    yes: [undefined],
    no: [null, 0, false, ""],
  },
  {
    name: "isString",
    check: guards.isString,
    yes: ["", " ", "hello"],
    no: [null, undefined, 0, false, Object("hello")],
  },
  {
    name: "isNumber",
    check: guards.isNumber,
    yes: [0, -0, 1.5, NaN, Infinity],
    no: [null, undefined, "1", false, 1n, Object(1)],
  },
  {
    name: "isBoolean",
    check: guards.isBoolean,
    yes: [true, false],
    no: [null, undefined, 0, "false", Object(false)],
  },
  {
    name: "isFunction",
    check: guards.isFunction,
    yes: [() => 1, async () => 1],
    no: [null, undefined, {}, "function"],
  },
])("$name checks types without coercing values", ({ check, yes, no }) => {
  for (const value of yes) expect(check(value)).toBe(true);
  for (const value of no) expect(check(value)).toBe(false);
});

test("primitive type guards narrow filtered unknown values", () => {
  const values: unknown[] = ["hello", 0, false, null, undefined];
  const strings = values.filter(guards.isString);
  const numbers = values.filter(guards.isNumber);
  const booleans = values.filter(guards.isBoolean);
  expect(strings).toEqual(["hello"]);
  expect(numbers).toEqual([0]);
  expect(booleans).toEqual([false]);
  expectTypeOf(strings).toEqualTypeOf<string[]>();
  expectTypeOf(numbers).toEqualTypeOf<number[]>();
  expectTypeOf(booleans).toEqualTypeOf<boolean[]>();
});

test("isPrimitive includes every JavaScript primitive, including nullish values", () => {
  for (const value of [null, undefined, "", 0, NaN, false, 1n, Symbol("id")]) {
    expect(guards.isPrimitive(value)).toBe(true);
  }
  for (const value of [{}, [], new Date(0), () => 1, Object("text")]) {
    expect(guards.isPrimitive(value)).toBe(false);
  }
});

test("isDefined narrows away nullish values while preserving falsy ones", () => {
  const values: Array<string | null | undefined> = [
    "a",
    null,
    "b",
    undefined,
    "",
  ];
  const defined = values.filter(guards.isDefined);
  expect(defined).toEqual(["a", "b", ""]);
  expectTypeOf(defined).toEqualTypeOf<string[]>();
});

test("isEmptyString and isBlankOrEmpty cover empty and whitespace", () => {
  expect(guards.isEmptyString("")).toBe(true);
  expect(guards.isEmptyString(null)).toBe(true);
  expect(guards.isEmptyString(" ")).toBe(false);

  expect(guards.isBlankOrEmpty(" ")).toBe(true);
  expect(guards.isBlankOrEmpty("")).toBe(true);
  expect(guards.isBlankOrEmpty(null)).toBe(true);
  expect(guards.isBlankOrEmpty("value")).toBe(false);
});

test("blank checks retain whitespace strings in their result type", () => {
  const values = ["", " ", "\t\n", "value", null, undefined] as const;
  const blank = values.filter(guards.isBlankOrEmpty);
  expect(blank).toEqual(["", " ", "\t\n", null, undefined]);
  expectTypeOf(blank).toEqualTypeOf<Array<(typeof values)[number]>>();

  // A boolean check cannot represent whitespace-only strings as a literal type.
  // It must not tell callers that every matching string is the empty string.
  for (const value of values) {
    if (guards.isBlankOrEmpty(value)) {
      expectTypeOf(value).toEqualTypeOf<(typeof values)[number]>();
    }
  }
});

test.each([
  {
    value: undefined,
    empty: true,
    blank: true,
    nonEmpty: false,
    nonBlank: false,
  },
  { value: null, empty: true, blank: true, nonEmpty: false, nonBlank: false },
  { value: "", empty: true, blank: true, nonEmpty: false, nonBlank: false },
  {
    value: " \t\n\u00a0",
    empty: false,
    blank: true,
    nonEmpty: true,
    nonBlank: false,
  },
  {
    value: " name ",
    empty: false,
    blank: false,
    nonEmpty: true,
    nonBlank: true,
  },
  { value: 0, empty: false, blank: false, nonEmpty: false, nonBlank: false },
  {
    value: false,
    empty: false,
    blank: false,
    nonEmpty: false,
    nonBlank: false,
  },
  { value: [], empty: false, blank: false, nonEmpty: false, nonBlank: false },
  { value: {}, empty: false, blank: false, nonEmpty: false, nonBlank: false },
])(
  "string presence checks distinguish empty, blank and wrong types: $value",
  ({ value, empty, blank, nonEmpty, nonBlank }) => {
    expect(guards.isEmptyString(value)).toBe(empty);
    expect(guards.isBlankOrEmpty(value)).toBe(blank);
    expect(guards.isNonEmptyString(value)).toBe(nonEmpty);
    expect(guards.isNonBlankString(value)).toBe(nonBlank);
  },
);

test("content checks do not narrow rejected strings out of a union", () => {
  const values: (string | number)[] = ["", " ", "name", 0];
  for (const value of values) {
    if (!guards.isNonEmptyString(value)) {
      expectTypeOf(value).toEqualTypeOf<string | number>();
    }
    if (!guards.isNonBlankString(value)) {
      expectTypeOf(value).toEqualTypeOf<string | number>();
    }
  }
});

test("array checks distinguish nullish, empty, sparse and populated arrays", () => {
  for (const value of [
    null,
    undefined,
    "",
    { length: 0 },
    new Set(),
    new Uint8Array(),
  ]) {
    expect(guards.isArray(value)).toBe(false);
    expect(guards.isEmptyArray(value)).toBe(false);
    expect(guards.isNonEmptyArray(value)).toBe(false);
  }
  expect(guards.isArray([])).toBe(true);
  expect(guards.isEmptyArray(Object.freeze([]))).toBe(true);
  expect(guards.isNonEmptyArray([])).toBe(false);
  for (const value of [
    [0],
    [false],
    [undefined],
    Object.freeze([1]),
    new Array(2),
  ]) {
    expect(guards.isArray(value)).toBe(true);
    expect(guards.isEmptyArray(value)).toBe(false);
    expect(guards.isNonEmptyArray(value)).toBe(true);
  }
});

test("array checks preserve readonly elements and narrow unknown input safely", () => {
  const mutable = [1];
  if (guards.isNonEmptyArray(mutable)) {
    mutable.push(2);
    expectTypeOf(mutable[0]).toEqualTypeOf<number>();
    expect(mutable).toEqual([1, 2]);
  }
  const values: readonly number[] | null = Object.freeze([1, 2]);
  if (guards.isNonEmptyArray(values)) {
    expectTypeOf(values).toEqualTypeOf<readonly [number, ...number[]]>();
    expect(values[0]).toBe(1);
  }
  const unknownValue: unknown = ["value"];
  if (guards.isArray(unknownValue)) {
    expectTypeOf(unknownValue).toEqualTypeOf<readonly unknown[]>();
  }
  if (guards.isNonEmptyArray(unknownValue)) {
    expectTypeOf(unknownValue).toEqualTypeOf<
      readonly [unknown, ...unknown[]]
    >();
  }
});

test("isRecord rejects null, arrays, and primitives", () => {
  expect(guards.isRecord({})).toBe(true);
  expect(guards.isRecord({ a: 1 })).toBe(true);
  expect(guards.isRecord([])).toBe(false);
  expect(guards.isRecord(null)).toBe(false);
  expect(guards.isRecord("str")).toBe(false);
});

test("isRecord accepts object instances without promising plain-object fields", () => {
  class Example {}
  for (const value of [
    Object.create(null),
    new Example(),
    new Date(0),
    new Map(),
  ]) {
    expect(guards.isRecord(value)).toBe(true);
  }
  expect(guards.isRecord(() => ({}))).toBe(false);
});

test("isPlainObject distinguishes dictionaries from other records", () => {
  class Example {}
  for (const value of [{}, { name: "value" }, Object.create(null)]) {
    expect(guards.isPlainObject(value)).toBe(true);
  }
  for (const value of [
    null,
    undefined,
    [],
    new Date(0),
    new Map(),
    new Example(),
  ]) {
    expect(guards.isPlainObject(value)).toBe(false);
  }
});

test("isScalar covers string, number, and boolean", () => {
  expect(guards.isScalar("a")).toBe(true);
  expect(guards.isScalar(1)).toBe(true);
  expect(guards.isScalar(false)).toBe(true);
  expect(guards.isScalar({})).toBe(false);
  expect(guards.isScalar([])).toBe(false);
  expect(guards.isScalar(null)).toBe(false);
  expect(guards.isScalar(NaN)).toBe(true);
  expect(guards.isScalar(Infinity)).toBe(true);
  expect(guards.isScalar(1n)).toBe(false);
  expect(guards.isScalar(Symbol("value"))).toBe(false);
});

test("isFiniteNumber and isNonNegativeSafeInteger validate numbers", () => {
  expect(guards.isFiniteNumber(1)).toBe(true);
  expect(guards.isFiniteNumber(Infinity)).toBe(false);
  expect(guards.isFiniteNumber(NaN)).toBe(false);
  expect(guards.isFiniteNumber("1")).toBe(false);

  expect(guards.isNonNegativeSafeInteger(5)).toBe(true);
  expect(guards.isNonNegativeSafeInteger(0)).toBe(true);
  expect(guards.isNonNegativeSafeInteger(-1)).toBe(false);
  expect(guards.isNonNegativeSafeInteger(1.5)).toBe(false);
});

test("integer checks reject coercion and distinguish the safe range", () => {
  for (const value of [
    0,
    -0,
    -1,
    1,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
  ]) {
    expect(guards.isInteger(value)).toBe(true);
    expect(guards.isSafeInteger(value)).toBe(true);
  }
  expect(guards.isInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(true);
  expect(guards.isSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  for (const value of [
    1.5,
    NaN,
    Infinity,
    -Infinity,
    "1",
    true,
    null,
    undefined,
    1n,
  ]) {
    expect(guards.isInteger(value)).toBe(false);
    expect(guards.isSafeInteger(value)).toBe(false);
  }
});

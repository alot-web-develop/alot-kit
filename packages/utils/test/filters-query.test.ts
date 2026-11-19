import { describe, expect, expectTypeOf, test } from "vitest";
import {
  allOf,
  anyOf,
  compactFilters,
  filterBySearch,
  isInDateRange,
  isInNumberRange,
  matchesSearch,
  matchesSelection,
  not,
  type Predicate,
} from "../src/filters.js";
import {
  fromSearchParams,
  toSearchParams,
  updateSearchParams,
} from "../src/query.js";
import { normalizeText, slugify, truncate } from "../src/strings.js";

describe("search and predicates", () => {
  test("normalizes composed/decomposed accents, whitespace and case", () => {
    expect(normalizeText("  CAFÉ\tDÉJÀ  ")).toBe("cafe deja");
    expect(matchesSearch("Cafe\u0301", "CAFÉ")).toBe(true);
    expect(matchesSearch("İstanbul", "istanbul", "tr")).toBe(true);
    expect(matchesSearch(0, "0")).toBe(true);
    expect(matchesSearch(false, "false")).toBe(true);
    expect(matchesSearch(null, "a")).toBe(false);
    expect(matchesSearch(undefined, " ")).toBe(true);
    expect(matchesSearch("hello", ".*")).toBe(false);
  });

  test("searches only explicit accessors and composes typed predicates", () => {
    const rows = Object.freeze([
      { name: "Café", price: 0, active: false, secret: "private" },
      { name: "Tea", price: 5, active: true, secret: "private" },
    ]);
    expect(filterBySearch(rows, "cafe", (row) => [row.name])).toEqual([
      rows[0],
    ]);
    expect(filterBySearch(rows, "false", (row) => [row.active])).toEqual([
      rows[0],
    ]);
    expect(filterBySearch(rows, "0", (row) => [row.price])).toEqual([rows[0]]);
    expect(filterBySearch(rows, "private", (row) => [row.name])).toEqual([]);
    expect(filterBySearch(rows, "  ", () => [])).toEqual(rows);
    const free: Predicate<(typeof rows)[number]> = (row) =>
      isInNumberRange(row.price, { max: 0 });
    const inactive: Predicate<(typeof rows)[number]> = (row) =>
      matchesSelection(row.active, [false]);
    expect(rows.filter(allOf(free, inactive))).toEqual([rows[0]]);
    expect(rows.filter(anyOf(free, not(inactive)))).toEqual(rows);
    expectTypeOf(allOf(free, inactive)).toExtend<
      Predicate<(typeof rows)[number]>
    >();
    expect(allOf()(null)).toBe(true);
    expect(anyOf()(null)).toBe(false);
    expect(matchesSelection(0, [0])).toBe(true);
    expect(matchesSelection(false, [])).toBe(true);
  });

  test("uses inclusive number bounds, including zero", () => {
    expect(isInNumberRange(0, { min: 0, max: 0 })).toBe(true);
    expect(isInNumberRange(-1, { max: 0 })).toBe(true);
    expect(isInNumberRange(5, {})).toBe(true);
    expect(isInNumberRange(-1, { min: 0 })).toBe(false);
    expect(isInNumberRange(NaN, {})).toBe(false);
    expect(isInNumberRange(Infinity, {})).toBe(false);
    expect(() => isInNumberRange(1, { min: 2, max: 1 })).toThrow(RangeError);
    expect(() => isInNumberRange(1, { min: NaN })).toThrow(RangeError);
  });

  test("compares date instants inclusively, validates bounds and ignores invalid candidates", () => {
    const instant = "2026-01-01T00:00:00Z";
    expect(
      isInDateRange(instant, {
        min: "2026-01-01T01:00:00+01:00",
        max: instant,
      }),
    ).toBe(true);
    expect(isInDateRange(0, { min: new Date(0) })).toBe(true);
    expect(isInDateRange("2025-12-31T23:59:59Z", { min: instant })).toBe(false);
    expect(isInDateRange("2026-02-30", {})).toBe(false);
    expect(() => isInDateRange(instant, { min: "bad" })).toThrow(RangeError);
    expect(() => isInDateRange("bad", { min: instant, max: 0 })).toThrow(
      RangeError,
    );
  });

  test("compacts own filters without dropping zero, false or prototype-named data", () => {
    const filters = Object.setPrototypeOf(
      JSON.parse(
        '{"__proto__":"data","constructor":false,"page":0,"active":false,"empty":"  ","tags":[],"null":null,"q":" hi "}',
      ),
      { inherited: "drop" },
    );
    expect(compactFilters(filters)).toEqual({
      ...JSON.parse('{"__proto__":"data"}'),
      constructor: false,
      page: 0,
      active: false,
      q: " hi ",
    });
    expect(Object.getPrototypeOf(compactFilters(filters))).toBe(
      Object.prototype,
    );
    expect(Object.hasOwn(compactFilters(filters), "inherited")).toBe(false);
  });
});

describe("query strings", () => {
  test("keeps 0/false/empty strings, repeats arrays and omits nullish values", () => {
    const params = toSearchParams({
      q: "café + tea",
      page: 0,
      active: false,
      empty: "",
      tags: ["a", null, "b", undefined],
      absent: null,
      nothing: [],
    });
    expect(params.get("q")).toBe("café + tea");
    expect(params.toString()).toBe(
      "q=caf%C3%A9+%2B+tea&page=0&active=false&empty=&tags=a&tags=b",
    );
    expect(fromSearchParams(params)).toEqual({
      q: ["café + tea"],
      page: ["0"],
      active: ["false"],
      empty: [""],
      tags: ["a", "b"],
    });
    expect(toSearchParams(fromSearchParams(params)).toString()).toBe(
      params.toString(),
    );
  });

  test("preserves repeated values and treats prototype names as ordinary keys", () => {
    const parsed = fromSearchParams(
      "?tag=a&tag=b&__proto__=value&constructor=false",
    );
    expect(Object.getPrototypeOf(parsed)).toBeNull();
    expect(Reflect.get(parsed, "__proto__")).toEqual(["value"]);
    expect(parsed.constructor).toEqual(["false"]);
    const source = Object.setPrototypeOf(
      JSON.parse('{"__proto__":"data","page":0}'),
      { inherited: "drop" },
    );
    expect(toSearchParams(source).toString()).toBe("__proto__=data&page=0");
  });

  test("updates a clone, replaces repeated keys and deletes nullish/empty arrays", () => {
    const input = new URLSearchParams(
      "q=tea&tag=old&tag=older&page=4&remove=yes",
    );
    const output = updateSearchParams(input, {
      tag: ["new", "next"],
      page: 0,
      remove: null,
      absent: [],
      active: false,
    });
    expect(output.toString()).toBe(
      "q=tea&tag=new&tag=next&page=0&active=false",
    );
    expect(input.toString()).toBe("q=tea&tag=old&tag=older&page=4&remove=yes");
  });

  test.each([{}, [[1]], new Date(), () => 1])(
    "rejects nested/non-scalar values: %s",
    (value) => {
      expect(() =>
        Reflect.apply(toSearchParams, undefined, [{ q: value }]),
      ).toThrow(TypeError);
    },
  );

  test.each([NaN, Infinity, -Infinity])(
    "rejects nonfinite query numbers: %s",
    (value) => {
      expect(() => toSearchParams({ value })).toThrow(RangeError);
    },
  );
});

test("Unicode slugs and bounded code-point truncation", () => {
  expect(slugify("  Déjà vu / 東京  ")).toBe("deja-vu-東京");
  expect(slugify("!!!")).toBe("");
  expect(truncate("😀abcd", 3)).toBe("😀a…");
  expect(truncate("abc", 0)).toBe("");
  expect(truncate("abc", 1, "...")).toBe(".");
  expect(truncate("ab", 2)).toBe("ab");
  expect(truncate("abcd", 2, "")).toBe("ab");
  expect(() => truncate("abc", -1)).toThrow(RangeError);
  expect(() => truncate("abc", 1.5)).toThrow(RangeError);
});

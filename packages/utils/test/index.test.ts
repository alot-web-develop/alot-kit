import { expect, expectTypeOf, test } from "vitest";
import * as format from "../src/format.js";
import * as guards from "../src/guards.js";
import * as entry from "../src/index.js";
import * as strings from "../src/strings.js";

test("root preserves format exports and template signatures", () => {
  for (const [name, implementation] of Object.entries(format)) {
    expect(Reflect.get(entry, name)).toBe(implementation);
  }
  expectTypeOf(entry.formatDate).toExtend<
    (value: string | Date, locale?: string) => string
  >();
});

test("root exports the same guards as the guards module", () => {
  for (const [name, implementation] of Object.entries(guards)) {
    expect(Reflect.get(entry, name)).toBe(implementation);
  }
});

test("root exports the same string helpers as the strings module", () => {
  for (const [name, implementation] of Object.entries(strings)) {
    expect(Reflect.get(entry, name)).toBe(implementation);
  }
});

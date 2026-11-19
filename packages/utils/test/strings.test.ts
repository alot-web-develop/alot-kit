import { expect, expectTypeOf, test } from "vitest";
import { trimToNull, trimToUndefined } from "../src/strings.js";

test.each([undefined, null, "", " \t\n\u00a0"])(
  "trimming normalizes missing or blank text: %s",
  (value) => {
    expect(trimToUndefined(value)).toBeUndefined();
    expect(trimToNull(value)).toBeNull();
  },
);

test("trimming retains text, internal whitespace, zero and false strings", () => {
  for (const value of ["hello", "a  b", "0", "false", "東京", "😀"]) {
    expect(trimToUndefined(` \t${value}\n`)).toBe(value);
    expect(trimToNull(` \t${value}\n`)).toBe(value);
  }
  expectTypeOf(trimToUndefined).returns.toEqualTypeOf<string | undefined>();
  expectTypeOf(trimToNull).returns.toEqualTypeOf<string | null>();
});

import { describe, expect, test } from "vitest";
import { formatCurrency, formatNumber } from "../src/format.js";

describe("formatNumber", () => {
  test("formats grouping and decimals by locale", () => {
    expect(formatNumber(1234.5, "en-US")).toBe("1,234.5");
    expect(formatNumber(12345.5, "it-IT")).toBe("12.345,5");
  });

  test("retains zero, negative zero and negative amounts", () => {
    expect(formatNumber(0, "en-US")).toBe("0");
    expect(formatNumber(-0, "en-US")).toBe("-0");
    expect(formatNumber(-1234.5, "en-US")).toBe("-1,234.5");
  });

  test("delegates rounding and precision to Intl", () => {
    expect(formatNumber(1.23456, "en-US")).toBe("1.235");
    const options = Object.freeze({
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    });
    expect(formatNumber(1234.567, "it-IT", options)).toBe("1234,57");
    expect(options.maximumFractionDigits).toBe(2);
    expect(formatNumber(0.125, "en-US", { style: "percent" })).toBe("13%");
  });

  test("uses the runtime locale when omitted", () => {
    expect(formatNumber(1234.5)).toBe(new Intl.NumberFormat().format(1234.5));
  });

  test("preserves Intl fallback and rejects malformed locales/options", () => {
    expect(formatNumber(1234.5, "zz-ZZ")).toBe(
      new Intl.NumberFormat("zz-ZZ").format(1234.5),
    );
    expect(() => formatNumber(1, "en_US")).toThrow(RangeError);
    expect(() =>
      formatNumber(1, "en-US", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 1,
      }),
    ).toThrow(RangeError);
  });
});

describe("formatCurrency", () => {
  test("formats major currency units with explicit currency and locale", () => {
    expect(formatCurrency(1234.5, "USD", "en-US")).toBe("$1,234.50");
    expect(formatCurrency(12345.5, "EUR", "it-IT")).toBe("12.345,50\u00a0€");
    expect(formatCurrency(-12.5, "USD", "en-US")).toBe("-$12.50");
    expect(formatCurrency(0, "USD", "en-US")).toBe("$0.00");
    expect(formatCurrency(-0, "USD", "en-US")).toBe("-$0.00");
  });

  test("uses currency-specific default fraction digits", () => {
    expect(formatCurrency(1234.5, "JPY", "en-US")).toBe("¥1,235");
    expect(formatCurrency(1.2345, "KWD", "en-US")).toBe("KWD\u00a01.235");
  });

  test("accepts lowercase and well-formed unknown codes, as Intl does", () => {
    expect(formatCurrency(1, "usd", "en-US")).toBe("$1.00");
    expect(formatCurrency(1, "ZZZ", "en-US")).toBe("ZZZ\u00a01.00");
  });

  test("supports display and precision options without mutating them", () => {
    const options = Object.freeze({
      currencySign: "accounting",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    } satisfies Intl.NumberFormatOptions);
    expect(formatCurrency(-1.5, "USD", "en-US", options)).toBe("($1.500)");
    expect(formatCurrency(1, "USD", "en-US", { currencyDisplay: "code" })).toBe(
      "USD\u00a01.00",
    );
    expect(options.currencySign).toBe("accounting");
  });

  test("keeps the explicit currency and style authoritative for JS callers", () => {
    const options = { style: "percent", currency: "EUR" };
    expect(
      Reflect.apply(formatCurrency, undefined, [1, "USD", "en-US", options]),
    ).toBe("$1.00");
  });

  test("uses the runtime locale when omitted", () => {
    expect(formatCurrency(1234.5, "EUR")).toBe(
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "EUR",
      }).format(1234.5),
    );
  });

  test.each(["", "US", "USDD", "$", "EU1"])(
    "rejects malformed currency codes: %s",
    (currency) => {
      expect(() => formatCurrency(1, currency)).toThrow(RangeError);
    },
  );

  test.each([undefined, null, 123])(
    "requires a currency string: %s",
    (currency) => {
      expect(() =>
        Reflect.apply(formatCurrency, undefined, [1, currency]),
      ).toThrow(TypeError);
    },
  );

  test("propagates invalid locales and precision options", () => {
    expect(() => formatCurrency(1, "EUR", "en_US")).toThrow(RangeError);
    expect(() =>
      formatCurrency(1, "EUR", "en-US", { maximumFractionDigits: -1 }),
    ).toThrow(RangeError);
  });
});

describe.each([
  ["formatNumber", (value: number) => formatNumber(value, "en-US")],
  ["formatCurrency", (value: number) => formatCurrency(value, "USD", "en-US")],
])("%s input validation", (_name, format) => {
  test.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects non-finite numbers: %s",
    (value) => {
      expect(() => format(value)).toThrow(RangeError);
    },
  );

  test.each([undefined, null, "1", true, {}, 1n])(
    "rejects values outside the number contract: %s",
    (value) => {
      expect(() => Reflect.apply(format, undefined, [value])).toThrow(
        TypeError,
      );
    },
  );
});

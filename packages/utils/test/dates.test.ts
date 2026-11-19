import "dayjs/locale/fr.js";
import { describe, expect, test } from "vitest";
import {
  dayjs,
  formatDate,
  isValidDate,
  parseDate,
  toISOString,
} from "../src/dates.js";

describe("Day.js date helpers", () => {
  const instant = "2026-01-02T00:30:00Z";

  test("keeps template locale calls and uses Day.js localized formats", () => {
    expect(formatDate(instant, "it-IT", { timeZone: "UTC" })).toBe(
      "02/01/2026",
    );
    expect(formatDate(instant, "en-US", { timeZone: "UTC" })).toBe(
      "01/02/2026",
    );
    expect(formatDate(instant)).toBe(parseDate(instant).format("L"));
    expect(formatDate(instant, "it")).toBe(
      parseDate(instant, { locale: "it" }).format("L"),
    );
    expect(
      formatDate(instant, "it-IT", { timeZone: "UTC", pattern: "D MMMM YYYY" }),
    ).toBe("2 gennaio 2026");
    expect(
      formatDate(instant, "fr-FR", { timeZone: "UTC", pattern: "D MMMM YYYY" }),
    ).toBe("2 janvier 2026");
  });

  test("converts instants across year and day boundaries", () => {
    expect(formatDate(instant, "en", { timeZone: "America/Los_Angeles" })).toBe(
      "01/01/2026",
    );
    expect(
      formatDate("2026-01-01T00:30:00Z", "en", {
        timeZone: "America/Los_Angeles",
        pattern: "YYYY-MM-DD",
      }),
    ).toBe("2025-12-31");
    expect(toISOString("2026-01-02T01:30:00+01:00")).toBe(
      "2026-01-02T00:30:00.000Z",
    );
    expect(toISOString("2026-01-02T00:30Z")).toBe("2026-01-02T00:30:00.000Z");
  });

  test("treats date-only strings as calendar dates in the selected zone", () => {
    for (const timeZone of ["UTC", "America/Los_Angeles", "Europe/Rome"]) {
      expect(
        formatDate("2024-02-29", "en", { timeZone, pattern: "YYYY-MM-DD" }),
      ).toBe("2024-02-29");
    }
    expect(toISOString("2024-02-29", { timeZone: "Europe/Rome" })).toBe(
      "2024-02-28T23:00:00.000Z",
    );
    expect(parseDate("2024-02-29").format("YYYY-MM-DD")).toBe("2024-02-29");
  });

  test("handles DST conversion for offset-qualified instants", () => {
    const options = { timeZone: "Europe/Rome", pattern: "YYYY-MM-DD HH:mm Z" };
    expect(formatDate("2026-03-29T00:30:00Z", "en", options)).toBe(
      "2026-03-29 01:30 +01:00",
    );
    expect(formatDate("2026-03-29T01:30:00Z", "en", options)).toBe(
      "2026-03-29 03:30 +02:00",
    );
    expect(formatDate("2026-10-25T00:30:00Z", "en", options)).toBe(
      "2026-10-25 02:30 +02:00",
    );
    expect(formatDate("2026-10-25T01:30:00Z", "en", options)).toBe(
      "2026-10-25 02:30 +01:00",
    );
  });

  test("strictly parses locale-aware custom wall dates", () => {
    const options = {
      inputFormat: "D MMMM YYYY HH:mm",
      locale: "it-IT",
      timeZone: "Europe/Rome",
    };
    expect(toISOString("2 gennaio 2026 09:30", options)).toBe(
      "2026-01-02T08:30:00.000Z",
    );
    expect(
      formatDate("29/02/2024", "it", {
        inputFormat: "DD/MM/YYYY",
        pattern: "YYYY-MM-DD",
        timeZone: "UTC",
      }),
    ).toBe("2024-02-29");
    expect(isValidDate("29/02/2025", { inputFormat: "DD/MM/YYYY" })).toBe(
      false,
    );
    expect(isValidDate("1/2/2026", { inputFormat: "DD/MM/YYYY" })).toBe(false);
    expect(isValidDate("2026/01/02", { inputFormat: "YYYY-MM-DD" })).toBe(
      false,
    );
    expect(isValidDate("2026-01-02T09:00:00")).toBe(false);
    expect(
      toISOString("2026-01-02 09:00", {
        inputFormat: "YYYY-MM-DD HH:mm",
        timeZone: "UTC",
      }),
    ).toBe("2026-01-02T09:00:00.000Z");
  });

  test("rejects nonexistent wall time and accepts Day.js fold resolution", () => {
    const options = {
      inputFormat: "YYYY-MM-DD HH:mm",
      timeZone: "Europe/Rome",
    };
    expect(() => parseDate("2026-03-29 02:30", options)).toThrow(RangeError);
    const fold = parseDate("2026-10-25 02:30", options);
    expect(fold.format("YYYY-MM-DD HH:mm")).toBe("2026-10-25 02:30");
    expect([60, 120]).toContain(fold.utcOffset());
  });

  test("returns immutable Day.js instances for arithmetic, including year rollover", () => {
    const original = parseDate("2026-01-31", { timeZone: "UTC" });
    const previous = original.subtract(1, "month");
    expect(previous.format("YYYY-MM-DD")).toBe("2025-12-31");
    expect(original.format("YYYY-MM-DD")).toBe("2026-01-31");
    expect(parseDate(original)).not.toBe(original);
    const date = Object.freeze(new Date(instant));
    const options = Object.freeze({ timeZone: "UTC" });
    expect(parseDate(date, options).toISOString()).toBe(
      "2026-01-02T00:30:00.000Z",
    );
    expect(date.toISOString()).toBe("2026-01-02T00:30:00.000Z");
    expect(toISOString(0)).toBe("1970-01-01T00:00:00.000Z");
  });

  test("does not mutate or inherit the global locale/default timezone", () => {
    const originalLocale = dayjs.locale();
    try {
      dayjs.locale("fr");
      dayjs.tz.setDefault("Pacific/Honolulu");
      expect(
        formatDate(instant, "it", { pattern: "MMMM", timeZone: "UTC" }),
      ).toBe("gennaio");
      expect(
        formatDate(instant, undefined, { pattern: "MMMM", timeZone: "UTC" }),
      ).toBe("January");
      expect(dayjs.locale()).toBe("fr");
      expect(parseDate(instant).valueOf()).toBe(Date.parse(instant));
    } finally {
      dayjs.locale(originalLocale);
      dayjs.tz.setDefault();
    }
  });

  test.each([
    "",
    "bad",
    "2026-02-30",
    "2025-02-29",
    "1900-02-29",
    "2026-00-10",
    "2026-13-01",
    "2026-01-02T24:00:00Z",
    "2026-01-02T12:60:00Z",
    "2026-01-02T12:00:60Z",
    "2026-01-02T12:00:00+24:00",
    "2026-01-02T12:00:00+01:60",
    new Date(Number.NaN),
    Number.NaN,
    Infinity,
  ])("rejects invalid dates: %s", (value) => {
    expect(() => parseDate(value)).toThrow(RangeError);
    expect(isValidDate(value)).toBe(false);
  });

  test("validates leap centuries", () => {
    expect(isValidDate("2000-02-29")).toBe(true);
    expect(isValidDate("2100-02-29")).toBe(false);
  });

  test.each([undefined, null, true, {}, { getTime: () => 0 }])(
    "rejects missing or unsupported inputs: %s",
    (value) => {
      expect(() => Reflect.apply(formatDate, undefined, [value])).toThrow(
        TypeError,
      );
    },
  );

  test("rejects unloaded locale, invalid zones and custom formats on nonstrings", () => {
    expect(() => parseDate(instant, { timeZone: "" })).toThrow(RangeError);
    expect(() => formatDate(instant, "zz-ZZ")).toThrow(RangeError);
    expect(() => formatDate(instant, "en_US")).toThrow(RangeError);
    expect(() => parseDate(instant, { timeZone: "Invalid/Zone" })).toThrow(
      RangeError,
    );
    expect(() => parseDate(0, { inputFormat: "YYYY-MM-DD" })).toThrow(
      TypeError,
    );
  });
});

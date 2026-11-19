import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import "dayjs/locale/it.js";

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

// CustomParseFormat accepts the locale argument in UTC mode too; utc.d.ts omits that overload.
const parseUtc = dayjs.utc as unknown as (
  value: string,
  format: string,
  locale: string,
  strict: boolean,
) => Dayjs;

export type DateInput = string | number | Date | Dayjs;
export type DateOptions = { locale?: string; timeZone?: string };
export type ParseDateOptions = DateOptions & { inputFormat?: string };
export type FormatDateOptions = Omit<ParseDateOptions, "locale"> & {
  pattern?: string;
};

function localeKey(locale = "en"): string {
  const requested = locale.toLowerCase();
  // Instance locale resolution also supports a registered base language (it-IT -> it).
  const resolved = dayjs(0).locale(requested).locale();
  if (resolved !== requested && resolved !== requested.split("-")[0]) {
    throw new RangeError(`Load the Day.js locale before using it: ${locale}`);
  }
  return resolved;
}

/**
 * Parses a string against an explicit custom format, validating calendar
 * fields independently of host timezone/DST and rejecting nonexistent wall
 * times caused by DST.
 */
function parseWithFormat(
  value: string,
  inputFormat: string,
  locale: string,
  timeZone: string | undefined,
): Dayjs {
  const wall = parseUtc(value, inputFormat, locale, true);
  if (!wall.isValid()) throw new RangeError("Invalid date or input format");

  const parsed =
    timeZone === undefined
      ? dayjs(value, inputFormat, locale, true)
      : dayjs.tz(wall.format("YYYY-MM-DD HH:mm:ss.SSS"), timeZone);

  // Day.js shifts nonexistent DST times forward. Strict parsing rejects that shift.
  if (
    !parsed.isValid() ||
    parsed.locale(locale).format(inputFormat) !== value
  ) {
    throw new RangeError("Invalid or nonexistent wall time");
  }
  return parsed;
}

/** Matches a date-only or date-time ISO string with optional offset. */
const ISO_PATTERN =
  /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2}))?$/;

/** Validates that ISO time and offset components fall within legal ranges. */
function assertValidIsoTime(match: RegExpExecArray): void {
  if (match[2] === undefined) return;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  const seconds = Number(match[4] ?? 0);
  const offset = match[6];

  const timeInvalid = hours > 23 || minutes > 59 || seconds > 59;
  const offsetInvalid =
    offset !== "Z" &&
    (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4)) > 59);

  if (timeInvalid || offsetInvalid) {
    throw new RangeError("Invalid ISO time or offset");
  }
}

/** Parses a strict ISO date string or an offset-qualified timestamp. */
function parseIsoString(value: string, options: ParseDateOptions): Dayjs {
  const match = ISO_PATTERN.exec(value);
  const dateValid =
    match !== null && dayjs.utc(match[1], "YYYY-MM-DD", true).isValid();
  if (match === null || !dateValid) {
    throw new RangeError(
      "Expected a valid ISO date or offset-qualified timestamp",
    );
  }
  assertValidIsoTime(match);

  // A date-only string is parsed through the custom-format path.
  if (match[2] === undefined) {
    return parseDate(value, { ...options, inputFormat: "YYYY-MM-DD" });
  }
  return dayjs(new Date(value));
}

/**
 * Parses a date value into a `Dayjs` instance with strict validation.
 *
 * Accepts ISO dates, offset-qualified timestamps, unix milliseconds, `Date`,
 * and `Dayjs`. When `inputFormat` is supplied, `value` must be a string parsed
 * in that format; when `timeZone` is supplied, the result is converted to it.
 *
 * @param value - The value to parse.
 * @param options - Locale, time zone, and custom input format.
 * @returns A valid, localized `Dayjs` instance.
 * @throws RangeError/TypeError for invalid or unsupported input.
 */
export function parseDate(
  value: DateInput,
  options: ParseDateOptions = {},
): Dayjs {
  const locale = localeKey(options.locale);
  let parsed: Dayjs;
  if (options.inputFormat !== undefined) {
    if (typeof value !== "string") {
      throw new TypeError("inputFormat requires a string");
    }
    parsed = parseWithFormat(
      value,
      options.inputFormat,
      locale,
      options.timeZone,
    );
  } else if (typeof value === "string") {
    parsed = parseIsoString(value, options);
  } else if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new RangeError("Expected finite milliseconds");
    parsed = dayjs(value);
  } else if (dayjs.isDayjs(value)) {
    parsed = value.clone();
  } else if (value instanceof Date) {
    parsed = dayjs(value);
  } else {
    throw new TypeError("Expected a string, milliseconds, Date or Dayjs");
  }
  if (!parsed.isValid()) throw new RangeError("Invalid date");
  if (options.timeZone !== undefined) parsed = parsed.tz(options.timeZone);
  return parsed.locale(locale);
}

/**
 * Returns whether a value is a valid date, treating range/type errors from
 * {@link parseDate} as `false` while rethrowing unexpected errors.
 *
 * @param value - The value to test.
 * @param options - Locale, time zone, and custom input format.
 * @returns `true` when the value parses to a valid date.
 */
export function isValidDate(
  value: DateInput,
  options?: ParseDateOptions,
): boolean {
  try {
    parseDate(value, options);
    return true;
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) return false;
    throw error;
  }
}

/**
 * Formats a date value. The locale is always the second argument; the default
 * pattern is Day.js's localized `L` format.
 *
 * @param value - The value to format.
 * @param locale - Locale used for formatting.
 * @param options - Time zone and pattern overrides.
 * @returns The formatted string.
 */
export function formatDate(
  value: DateInput,
  locale?: string,
  options: FormatDateOptions = {},
): string {
  return parseDate(value, { ...options, locale }).format(
    options.pattern ?? "L",
  );
}

/**
 * Converts a date value to its UTC ISO 8601 string representation.
 *
 * @param value - The value to convert.
 * @param options - Locale, time zone, and custom input format.
 * @returns The ISO string.
 */
export function toISOString(
  value: DateInput,
  options?: ParseDateOptions,
): string {
  return parseDate(value, options).toISOString();
}

export type { Dayjs };
export { dayjs };

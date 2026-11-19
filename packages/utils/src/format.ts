export { formatDate } from "./dates.js";

/**
 * Formats a finite number using `Intl.NumberFormat`.
 *
 * @param value - The number to format (must be finite).
 * @param locale - Locale passed to the formatter.
 * @param options - Number formatting options.
 * @returns The localized string representation.
 */
const formatNumber = (
  value: number,
  locale?: string,
  options?: Intl.NumberFormatOptions,
): string => {
  if (typeof value !== "number") throw new TypeError("Expected a number");
  if (!Number.isFinite(value)) throw new RangeError("Expected a finite number");

  return new Intl.NumberFormat(locale, options).format(value);
};

/**
 * Formats a finite number as a currency amount.
 *
 * @param value - The amount to format (must be finite).
 * @param currency - ISO currency code.
 * @param locale - Locale passed to the formatter.
 * @param options - Number formatting options (style/currency are reserved).
 * @returns The localized currency string.
 */
const formatCurrency = (
  value: number,
  currency: string,
  locale?: string,
  options?: Omit<Intl.NumberFormatOptions, "style" | "currency">,
): string => {
  if (typeof currency !== "string")
    throw new TypeError("Expected a currency code");

  return formatNumber(value, locale, {
    ...options,
    style: "currency",
    currency,
  });
};

export { formatCurrency, formatNumber };

/**
 * Formats a decimal fraction as a percentage. A value of `0.25` yields `25%`.
 *
 * @param value - The fraction to format (must be finite).
 * @param locale - Locale passed to the formatter.
 * @param options - Number formatting options (style is reserved).
 * @returns The localized percentage string.
 */
export function formatPercent(
  value: number,
  locale?: string,
  options?: Omit<Intl.NumberFormatOptions, "style">,
): string {
  return formatNumber(value, locale, { ...options, style: "percent" });
}

export type FormatBytesOptions = {
  base?: 1000 | 1024;
  locale?: string;
  maximumFractionDigits?: number;
};

/**
 * Formats a byte count in binary (base 1024) or decimal (base 1000) units.
 *
 * @param value - Nonnegative finite byte count.
 * @param options - Base, locale, and precision options.
 * @returns A string like `1.5 MiB` or `4 kB`.
 */
export function formatBytes(
  value: number,
  options: FormatBytesOptions = {},
): string {
  if (typeof value !== "number")
    throw new TypeError("Expected bytes as a number");
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError("Expected finite nonnegative bytes");
  const { base = 1024, locale, maximumFractionDigits = 2 } = options;
  if (base !== 1000 && base !== 1024)
    throw new RangeError("Expected base 1000 or 1024");
  const units =
    base === 1024
      ? ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"]
      : ["B", "kB", "MB", "GB", "TB", "PB", "EB"];

  const unitIndex =
    value === 0 ? 0 : Math.floor(Math.log(value) / Math.log(base));
  const safeIndex = Math.max(0, Math.min(unitIndex, units.length - 1));
  return `${formatNumber(value / base ** safeIndex, locale, { maximumFractionDigits })} ${units[safeIndex]}`;
}

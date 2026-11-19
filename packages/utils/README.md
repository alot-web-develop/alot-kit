# @alot-web-develop/utils

Framework-independent website helpers with typed ESM root and module exports. Day.js handles dates, es-toolkit supplies selected general algorithms, and native Web/Intl APIs handle query strings, multipart data and number formatting.

```ts
import { formatDate, parseDate } from "@alot-web-develop/utils/dates";
import { formatCurrency } from "@alot-web-develop/utils/format";
import { compactFilters, matchesSearch } from "@alot-web-develop/utils/filters";
import { toSearchParams } from "@alot-web-develop/utils/query";

formatDate("2026-01-02", "it-IT"); // "02/01/2026"
formatDate("2026-01-02T00:30:00Z", "it", {
  timeZone: "Europe/Rome",
  pattern: "D MMMM YYYY HH:mm",
}); // "2 gennaio 2026 01:30"
parseDate("2026-01-31").subtract(1, "month").format("YYYY-MM-DD"); // "2025-12-31"
formatCurrency(12345.5, "EUR", "it-IT"); // "12.345,50 €"
matchesSearch("Café", "cafe"); // true
toSearchParams(
  compactFilters({ page: 0, active: false, tags: ["a", "b"], q: " " }),
).toString(); // "page=0&active=false&tags=a&tags=b"
```

## Catalog

Every function is also exported from `@alot-web-develop/utils`.

| Subpath        | Exports                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/dates`       | `formatDate`, `parseDate`, `isValidDate`, `toISOString`, configured `dayjs`                                                          |
| `/format`      | `formatDate`, `formatNumber`, `formatCurrency`, `formatPercent`, `formatBytes`                                                       |
| `/filters`     | `matchesSearch`, `filterBySearch`, `matchesSelection`, `isInNumberRange`, `isInDateRange`, `allOf`, `anyOf`, `not`, `compactFilters` |
| `/query`       | `toSearchParams`, `fromSearchParams`, `updateSearchParams`                                                                           |
| `/collections` | `groupBy`, `keyBy`, `uniqBy`, `sortBy`, `orderBy`, `chunk`, `partition`, `compact`, `pick`, `omit`, `isDefined`                      |
| `/guards`      | Primitive type, presence, array, object and numeric checks; see the catalog below                                                    |
| `/strings`     | `normalizeText`, `slugify`, `truncate`, `trimToUndefined`, `trimToNull`                                                              |
| `/async`       | `debounce`, `throttle`, `sleep`                                                                                                      |
| `/files`       | `formatBytes`, `getFileExtension`, `matchesFileAccept`, `validateFile`, `validateFiles`, `toFormData`, `createFilePreview`           |

Types accompany the functions: `DateInput`, `DateOptions`, `ParseDateOptions`, `FormatDateOptions`, `Dayjs`, `FormatBytesOptions`, `Predicate`, `Range`, `SearchValue`, `QueryScalar`, `QueryValue`, `QueryRecord`, `FileMetadata`, `FileRules`, `FileIssue`, `FileValidation`, `FormDataScalar`, `FormDataValue`, plus es-toolkit timing types.

## Dates: Day.js

```ts
type DateInput = string | number | Date | Dayjs;
type ParseDateOptions = { locale?: string; timeZone?: string; inputFormat?: string };
parseDate(value: DateInput, options?: ParseDateOptions): Dayjs;
formatDate(value: DateInput, locale?: string, options?: {
  pattern?: string; timeZone?: string; inputFormat?: string;
}): string;
isValidDate(value: DateInput, options?: ParseDateOptions): boolean;
toISOString(value: DateInput, options?: ParseDateOptions): string;
```

`formatDate` calls Day.js `.format()` with localized `L` by default. English (`en`) is the deterministic default; Italian (`it`) is included. Locale is set on the individual instance. Registered regional names are tried first, then their registered base language: `it-IT` resolves to `it`, `en-US` to `en`. Other locales must be loaded by the app, e.g. `import "dayjs/locale/fr.js"` (declare Day.js directly in the app when importing it). An unloaded locale throws `RangeError`.

Helpers never set global locale or default timezone. Importing `/dates` directly or through re-exports installs CustomParseFormat, LocalizedFormat, UTC and Timezone on the shared Day.js singleton and registers Italian. `sideEffects` retains that initializer for bundlers. The exported `dayjs` supports native immutable arithmetic without dozens of wrappers. Raw `dayjs()` retains upstream permissive parsing/global defaults; use `parseDate` for the strict helper contract.

Input semantics:

- **ISO date-only** (`2024-02-29`) is a calendar date at midnight in the requested `timeZone`, or the host zone when omitted. Formatting in that call keeps its calendar day. Serializing it turns midnight into an instant: Rome midnight on that date becomes `2024-02-28T23:00:00.000Z`.
- **ISO timestamps** identify instants and require `Z` or an offset such as `+01:00`. Supported subset: `YYYY-MM-DDTHH:mm[:ss[.SSS]]Z`, or with a colon-separated offset; fractions allow 1–3 digits. Calendar overflow, `24:00`, leap seconds and invalid offsets are rejected. Strict string parsing supports four-digit years 0100–9999.
- **Custom wall dates/times** require `inputFormat`, with strict exact delimiters and locale-aware names: `parseDate("29/02/2024 09:30", { inputFormat: "DD/MM/YYYY HH:mm", timeZone: "Europe/Rome" })`. This interprets the clock in the specified zone. Use complete date patterns for reproducible parsing; omitted fields inherit Day.js defaults. Offset-bearing input belongs in the ISO branch instead of custom wall parsing.
- **Numbers** mean Unix milliseconds, including zero. Date/Dayjs inputs are cloned without mutation.

Timezone converts instants for display; locale controls names/patterns independently. Without a zone, string/Date/millisecond display and wall parsing use the host zone; a Dayjs input retains its own zone. Supply locale and IANA zone explicitly for reproducible SSR. The host must provide Intl timezone data. DST conversions are tested; strict wall parsing rejects nonexistent spring-forward times. Repeated autumn times use Day.js offset selection, which can depend on the current offset: an offset-qualified ISO instant chooses an occurrence deterministically. Day.js arithmetic across DST retains upstream semantics; convert to the target zone again when needed.

Invalid input throws `RangeError`; unsupported runtime types, including null/undefined, throw `TypeError`. Missing input never becomes the current time. `isValidDate` returns false for either validation error, including invalid locale/zone options.

### Migration from the initial draft

The unreleased Intl date implementation in PR #8 is replaced by Day.js. Template calls `formatDate(value)` and `formatDate(value, locale)` remain valid; the second argument always means locale. The **third argument now uses Day.js options**: replace Intl `dateStyle` or date fields with `pattern`, e.g. `{ pattern: "D MMMM YYYY", timeZone: "UTC" }`. Localized `L` pads numeric fields (`01/02/2026` in English); omitted date locale now means English. Calendar overflow fails, date-only means a calendar date, and offset-free timestamps require `inputFormat`.

## Numbers, currency, percent, bytes

`formatNumber(value, locale?, IntlOptions?)` and `formatCurrency(value, currency, locale?, IntlOptions?)` retain native Intl grouping, rounding and locale negotiation. Finite numbers only: nonfinite values throw `RangeError`, unsupported types throw `TypeError`. Zero and negative zero are retained. Omitted number locale uses the host default, so supply it for reproducible SSR.

Currency is required, amounts are **major units**, and Intl chooses currency precision (JPY zero digits, USD/EUR two, KWD three). Native precision/display/accounting options can override defaults; explicit currency/style arguments remain authoritative. Currency syntax follows Intl: three letters, including unknown codes. No conversion or decimal arithmetic.

`formatPercent(0.25, "en-US")` gives `25%`; style is authoritative. `formatBytes(1536, { base: 1024, locale: "en-US", maximumFractionDigits: 2 })` gives `1.5 KiB`. Defaults are IEC base 1024 and up to two decimals; choose base 1000 for SI (`kB`, `MB`). Bytes must be nonnegative and finite; units cap at EiB/EB. Display rounding does not promote a value to the next unit. Intl locale/option errors propagate.

## Search and filters

`normalizeText(text, locale?)` applies Unicode NFKD, locale lowercase, removal of combining marks, trimming and whitespace collapsing. `matchesSearch(value, query, locale?)` performs literal substring matching on strings/numbers/booleans/nullish values. Empty query matches all; `0` and `false` are searchable. This is accent-insensitive search, not full linguistic equivalence/transliteration. Supply a locale for language-specific casing.

```ts
import {
  allOf,
  filterBySearch,
  isInNumberRange,
  matchesSelection,
} from "@alot-web-develop/utils/filters";
const visible = filterBySearch(products, query, (product) => [
  product.title,
  product.code,
]);
const selected = visible.filter(
  allOf(
    (product) => isInNumberRange(product.price, { min: 0, max: 100 }),
    (product) => matchesSelection(product.active, [false]),
  ),
);
```

`filterBySearch` returns a new array and searches only accessor-selected fields. `matchesSelection` uses `includes`; empty selection means no restriction. `allOf`, `anyOf`, `not` create typed short-circuiting predicates; empty allOf is true, empty anyOf is false.

Ranges use inclusive `{ min?, max? }` bounds. Numeric candidates must be finite; invalid candidates return false. Bounds must be finite and ordered or throw `RangeError`. `isInDateRange` compares **instants in milliseconds**, not calendar-day buckets; invalid candidates return false and invalid bounds throw. Date-only values use the host zone; supply `parseDate(date, { timeZone })` when a specific zone matters.

`compactFilters` removes nullish values, whitespace-only strings and empty arrays from own enumerable string entries. It retains `0`, `false`, nonempty strings unchanged and nested values without recursion. Prototype-named keys remain data properties; inherited entries are ignored.

## Query strings

```ts
const params = toSearchParams({
  page: 0,
  active: false,
  tag: ["a", "b"],
  empty: "",
  gone: null,
});
params.toString(); // "page=0&active=false&tag=a&tag=b&empty="
fromSearchParams(params); // { page: ["0"], active: ["false"], tag: ["a", "b"], empty: [""] }
updateSearchParams(params, { tag: ["c"], page: null }).toString();
// "active=false&empty=&tag=c"
```

`toSearchParams` accepts flat string/finite number/boolean/nullish values or readonly arrays. Arrays repeat keys in order; nullish entries and empty arrays are omitted. Empty strings, false and zero survive. Nested arrays/objects throw `TypeError`; nonfinite numbers throw `RangeError`. Only own enumerable string entries are used; native URLSearchParams handles escaping (`+` represents spaces).

`fromSearchParams(query | URLSearchParams)` always returns arrays of strings in a null-prototype object, retaining duplicates and keys such as `__proto__`. There is no boolean/number coercion or recovery of omitted nulls/empty arrays. Strings are queries (optional `?`), not full URLs. `updateSearchParams` clones, deletes each supplied key, then appends replacement values. Nullish/empty arrays delete keys; other keys survive. For full URLs, assign `url.search = params.toString()`.

## Collections, objects and strings

`chunk`, `compact`, `uniqBy`, `sortBy`, `orderBy`, `partition` and `omit` are selected **es-toolkit** re-exports with upstream signatures/semantics, without the Lodash compatibility layer. Results are new arrays/objects with shallow references. `uniqBy` retains first occurrence; `sortBy` is ascending, `orderBy` supports multiple accessors/directions. Normalize nullish sort values in accessors if upstream ordering is unsuitable. `compact` drops **all falsy values**, including `0` and `false`; `isDefined` removes only null/undefined with type narrowing.

`groupBy(items, getKey)` returns a null-prototype dictionary. `keyBy(items, getKey)` returns an ordinary object; last item wins on duplicates. Both support symbols and prototype-named keys, and type missing entries as possibly undefined. `pick(object, keys)` copies selected own fields (including selected symbols/nonenumerable fields) as ordinary data properties. `omit` copies own enumerable string/symbol properties and removes the specified keys. These helpers are shallow. The three small groupBy/keyBy/pick adapters deliberately avoid upstream assignment-to-`{}` behavior for `__proto__`.

`slugify` lowercases, removes combining accents, retains Unicode letters/numbers, and replaces other runs with hyphens: `Déjà vu / 東京` → `deja-vu-東京`. It can return empty and does not guarantee unique IDs or ASCII transliteration. `truncate(text, maxLength, suffix = "…")` counts Unicode code points, suffix included in the nonnegative integer limit. An oversized suffix is truncated too. Surrogate pairs stay intact; grapheme clusters such as joined emoji can split.

## Value guards

Use named checks in page and feature code to express intent without repeating `typeof`, nullish comparisons and whitespace checks. All guards accept `unknown`; none coerce input. Import them from `/guards` or the package root.

| Purpose             | Functions                                                                              |
| ------------------- | -------------------------------------------------------------------------------------- |
| Missing values      | `isNull`, `isUndefined`, `isNullOrUndefined`, `isDefined`                              |
| Primitive types     | `isString`, `isNumber`, `isBoolean`, `isFunction`, `isPrimitive`                       |
| String presence     | `isEmptyString`, `isBlankOrEmpty`, `isNonEmptyString`, `isNonBlankString`              |
| Arrays              | `isArray`, `isEmptyArray`, `isNonEmptyArray`                                           |
| Objects             | `isRecord`, `isPlainObject`                                                            |
| Numbers and scalars | `isScalar`, `isFiniteNumber`, `isInteger`, `isSafeInteger`, `isNonNegativeSafeInteger` |

```ts
import {
  isBlankOrEmpty,
  isDefined,
  isNonEmptyArray,
  isString,
} from "@alot-web-develop/utils/guards";
import { trimToUndefined } from "@alot-web-develop/utils/strings";

function prepareSearch(name: string | null, selectedIds: (number | null)[]) {
  if (isBlankOrEmpty(name)) return;
  const ids = selectedIds.filter(isDefined); // number[]; retains 0
  if (!isNonEmptyArray(ids)) return;
  return { name: trimToUndefined(name), ids };
}

function readLabel(value: unknown): string | undefined {
  if (!isString(value)) return;
  return trimToUndefined(value);
}
```

String presence rules are explicit:

| Input                         | `isEmptyString` | `isBlankOrEmpty` | `isNonEmptyString` | `isNonBlankString` |
| ----------------------------- | --------------- | ---------------- | ------------------ | ------------------ |
| `null`, `undefined`           | true            | true             | false              | false              |
| `""`                          | true            | true             | false              | false              |
| `"   "`                       | false           | true             | true               | false              |
| `" name "`                    | false           | false            | true               | true               |
| `0`, `false`, objects, arrays | false           | false            | false              | false              |

`isNullOrUndefined`, `isDefined`, `isEmptyString` and the primitive type guards narrow their input types. `isBlankOrEmpty`, `isNonEmptyString`, `isNonBlankString`, `isInteger` and `isSafeInteger` return booleans: content/range checks must not incorrectly exclude all strings/numbers in the false branch. Use `isString` or `isNumber` when narrowing an unknown value before accessing it. `isEmptyString` and `isBlankOrEmpty` accept unknown input, including data from forms and APIs.

`isArray` narrows unknown input to `readonly unknown[]`; existing element types and readonly input remain intact. `isEmptyArray` matches actual zero-length arrays only; nullish values are false. `isNonEmptyArray` narrows to a nonempty readonly tuple and preserves the element type of known arrays. These are length checks, not element validation: `[undefined]` and sparse arrays with positive length count as nonempty. Array-like objects, typed arrays and sets are false.

`isRecord` accepts any non-null, non-array object, including class instances, dates, maps and null-prototype objects. It does not validate fields or guarantee a plain object. `isPlainObject` uses es-toolkit's stricter dictionary check, accepting object literals and null-prototype objects while rejecting class instances, dates and maps. `isString`, `isNumber`, `isBoolean`, `isFunction`, `isNull`, `isUndefined`, `isPrimitive` and `isPlainObject` are selected es-toolkit re-exports. `isPrimitive` includes null, undefined, bigint and symbol, in addition to string/number/boolean; functions and objects are false.

`isScalar` and `isNumber` accept nonfinite numbers. Use `isFiniteNumber` for finite numbers, `isInteger` for integer numbers, `isSafeInteger` for JavaScript's safe integer range, and `isNonNegativeSafeInteger` for nonnegative safe integers, including zero. Numeric strings and boxed numbers are rejected.

`trimToUndefined(value)` and `trimToNull(value)` in `/strings` trim nullable strings and normalize missing/empty/whitespace-only input to the named absence value. They preserve internal whitespace and text such as `"0"` and `"false"`. Use them to prepare optional search fields and form payloads instead of repeating trim/fallback expressions.

The `isBlankOrEmpty` return type corrects the initial `0.1.0` declaration, which incorrectly narrowed matching whitespace strings to `""`. Runtime behavior stays the same; consumers relying on that narrowing must add explicit checks.

References: [es-toolkit primitive string guards](https://es-toolkit.dev/reference/predicate/isString.html), [plain-object semantics](https://es-toolkit.dev/reference/predicate/isPlainObject.html), and [TypeScript narrowing in both branches](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates).

## Async timing

```ts
import { debounce, sleep } from "@alot-web-develop/utils/async";
const controller = new AbortController();
const search = debounce((query: string) => console.log(query), 250, {
  signal: controller.signal,
});
search("tea");
search.flush(); // run pending call now
search.cancel(); // discard pending call; reusable afterwards
controller.abort(); // disables this debounced function
await sleep(200, anotherController.signal);
```

`debounce`/`throttle` use es-toolkit native APIs: cancel, flush, preservation of this/latest arguments, AbortSignal and `edges`. Debounce defaults to trailing; throttle to leading + trailing. Calls return void, including async callbacks; handle callback errors in the callback. Cancel discards pending work; abort also disables future calls. Neither cancels already-started callback work.

`sleep(milliseconds, signal?)` resolves after a finite delay from 0 to 2,147,483,647 ms. Abort rejects with `signal.reason`, including already-aborted signals. Completion/cancellation removes listeners and clears timers. Invalid delay throws synchronously.

## Files and upload preparation

```ts
import {
  createFilePreview,
  toFormData,
  validateFiles,
} from "@alot-web-develop/utils/files";
const result = validateFiles(files, {
  accept: ".pdf,image/*",
  maxSize: 5 * 1024 ** 2,
  maxFiles: 3,
});
if (result.valid) {
  const form = toFormData({
    files: Array.from(files),
    published: false,
    position: 0,
    tags: ["a", "b"],
  });
  // With @alot-web-develop/api: api.post('/uploads', { body: form, signal });
  // Let the runtime generate Content-Type including the multipart boundary.
}
const preview = createFilePreview(file);
image.src = preview.url;
preview.revoke(); // on replacement/unmount; idempotent
```

Validation accepts structural `{ name, size, type }` metadata, native File arrays and iterable FileLists. `validateFile(file, { accept?, minSize?, maxSize? })` / `validateFiles(files, { ...rules, maxFiles? })` return `{ valid, issues }`. Codes: `invalid_size`, `too_small`, `too_large`, `invalid_type`, `too_many`. Issues carry `limit` when relevant and `fileIndex` for list-item issues. Limits are inclusive nonnegative safe integers; invalid/reversed rules throw even on empty lists. Zero-byte files are allowed unless minSize says otherwise; no implicit minimum count.

`matchesFileAccept` supports comma-separated strings or token arrays: extensions (`.pdf`, `.tar.gz`), exact MIME types or wildcards (`image/*`). Case-insensitive alternatives; blank means unrestricted, malformed tokens throw. MIME is never guessed from an extension. Empty MIME fails `image/*` but a filename can match `.png`. Client metadata validation guides the user; server code validates actual contents.

`getFileExtension(filename)` returns the final lowercase extension without dot; `.env`, names without dots and trailing dots return empty. Path-like filenames are accepted, URLs are not parsed.

`toFormData` creates native FormData at invocation with flat scalars, native Blob/File or readonly arrays. It skips nullish values, stringifies finite numbers/booleans, retains empty strings/filenames, and repeats array keys. Native Blob uses the runtime's default filename (`blob`); File supplies a filename. Nested objects/arrays throw. FormData/Blob and object URL capabilities must exist when their helpers are called. Preview returns a URL with cleanup and throws when unsupported. Nothing accesses window/document at import time.

## Dependencies, sources and verification

Day.js is the requested date engine. es-toolkit avoids duplicating general algorithms/timing. URLSearchParams, FormData, Unicode normalization and Intl stay native. There are no framework, UI, HTTP transport, storage or server dependencies. References include [Day.js strict parsing](https://day.js.org/docs/en/parse/string-format), [instance locale](https://day.js.org/docs/en/i18n/instance-locale), [timezone](https://day.js.org/docs/en/plugin/timezone), [es-toolkit debounce](https://es-toolkit.dev/reference/function/debounce.html), [URL Standard](https://url.spec.whatwg.org/#interface-urlsearchparams), and [FormData](https://xhr.spec.whatwg.org/#interface-formdata).

With Node 24 and pinned pnpm, using the existing shared store:

```sh
export PNPM_STORE_DIR="$(pnpm store path)"
export PNPM_PACKAGE_IMPORT_METHOD=hardlink
pnpm install --store-dir "$PNPM_STORE_DIR" --package-import-method=hardlink
pnpm check
TZ=UTC pnpm --filter @alot-web-develop/utils test
TZ=America/Los_Angeles pnpm --filter @alot-web-develop/utils test
node packages/gen/test/react/verify.mjs
```

The verifier installs the actual tarball with real React dependencies, checks declarations/generated date columns and all ESM subpaths, and imports without browser/file globals. Store comes from the environment or root `pnpm store path`; `PNPM_PACKAGE_IMPORT_METHOD` defaults to auto for cross-filesystem CI. It removes its fixture, tarball and temporary dependencies in finally, retaining shared caches.

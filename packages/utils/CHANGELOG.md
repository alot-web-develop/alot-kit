# @alot-web-develop/utils

## 0.2.0

### Minor Changes

- 3682ced: Publish publicly on npm under the MIT license. Installing no longer requires a GitHub Packages token or a scoped registry entry.

## 0.1.0

### Minor Changes

- 051a50e: Implement a framework-independent web toolkit with typed root and subpath exports for dates, formatting, filters/search, query strings, collections/objects, strings, async timing and file/upload preparation.

  Use Day.js for strict calendar/custom parsing, localized formatting, UTC/timezone conversion and native immutable operations. Preserve template formatDate(value, locale?) calls; replace the unreleased Intl third argument with { pattern?, timeZone?, inputFormat? }. Dates now reject overflow, date-only strings represent calendar dates, and default date locale is English with Italian included. Retain Intl number/currency formatting and add percent/IEC-SI byte formatting.

  Reuse selected es-toolkit algorithms and cancellable debounce/throttle, with small safe adapters for prototype-named collection/object keys. Add normalized search, typed predicates, inclusive ranges, filter cleanup, repeated-key queries, metadata file validation, native FormData preparation, preview cleanup and abortable sleep. Document migration, examples and primary-source research. Verify the packed package in real React consumers with shared-store installs and automatic cleanup; HTTP transport stays in the API package.

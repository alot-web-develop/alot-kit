# @alot-web-develop/api

## 0.2.0

### Minor Changes

- 3682ced: Publish publicly on npm under the MIT license. Installing no longer requires a GitHub Packages token or a scoped registry entry.

## 0.1.0

### Minor Changes

- 092fa78: Implement the framework-independent JSON API client used by React, React Native and Svelte templates: discriminated ApiResult, ApiError/unwrap, query serialization, per-request async auth headers/token, cookie credentials, unauthorized hooks and native cancellation. Support direct JSON and exact server envelopes with explicit response modes, and provide OpenAPI path response/body/query helpers aligned with runtime decoding.

  Support native multipart and binary upload bodies without JSON serialization; Fetch generates FormData boundaries.
- 36960ea: Preserve optional server validation details in ApiResult and ApiError.errorDetails so form consumers can narrow and map field errors without reimplementing HTTP transport. HTTP status remains authoritative.

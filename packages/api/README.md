# @alot-web-develop/api

Framework independent JSON fetcher and OpenAPI type helpers. No runtime dependencies, React, or TanStack imports. Requires standard `fetch`, `Headers`, `URL`, `URLSearchParams`, and `AbortSignal` APIs (Node 24, modern browsers, or a compatible native runtime).

```ts
import { createFetcher, unwrap, ApiError } from "@alot-web-develop/api";

const api = createFetcher({
  baseUrl: "https://api.example.com/api",
  credentials: "include", // browser cookie sessions
  onUnauthorized: async () => {
    await signOut();
  },
});

type Order = { id: string; name: string };
const result = await api.get<Order>("/orders/one");
if (result.error) {
  console.error(result.errorDetails.title, result.errorDetails.message);
} else {
  console.log(result.data.name);
}

// Useful directly in a queryFn or mutationFn:
const order = await unwrap(
  api.post<Order>("/orders", { body: { name: "New" } }),
);
// Failed results throw ApiError, whose message, title and optional status are
// consumed by generated query retry and notification policies.
```

## Request contract

`createFetcher(config): ApiClient` exposes `get/post/put/patch/delete<T>(path, options?)`, each returning `Promise<ApiResult<T>>`. `options` accepts `{ query?: object, body?: unknown, signal?: AbortSignal }`, matching the React, React Native, and Svelte generator contracts in [`TEMPLATES.md`](../gen/TEMPLATES.md). It does not implement retries or UI policies.

- `baseUrl` must be an absolute HTTP(S) URL. Its pathname is a prefix: both `/orders` and `orders` append to `https://host/api/` as `https://host/api/orders`. Paths are API resources, not alternate absolute URLs. Invalid configuration rejects/throws rather than becoming a network error.
- Existing base and resource query parameters are preserved. Resource parameters override base parameters of the same name; `options.query` overrides both. String, number, and boolean values use standard URL encoding; arrays become repeated keys. Null/undefined entries are omitted, an empty array removes an existing key, and nested objects reject. URL fragments stay after the query. Path IDs must be encoded by the caller when needed.
- JSON `body` values are serialized, including `null`. Native `FormData`, `Blob`/`File`, `URLSearchParams`, `ArrayBuffer` and typed-array views pass through to Fetch unchanged. For `FormData`, any configured `Content-Type` is removed so Fetch can generate a valid multipart boundary. Other native bodies preserve configured headers or let Fetch infer their media type. JSON serialization errors reject. `Content-Type: application/json` is added only for JSON and only if absent; `Accept: application/json` is added if absent. GET requests should not supply a body.
- `headers` accepts `HeadersInit` or a sync/async function returning it, evaluated per request and copied without mutation. `getToken` is optional, accepts a sync/async string or `null`, and is also evaluated per request. A nonempty token sets `Authorization: Bearer …`, overriding an existing authorization header; absent/null/empty tokens preserve caller headers.
- `credentials` is forwarded unchanged. When omitted, Fetch retains its standard `same-origin` default. The React template sets `include` for browser cookies. React Native uses `headers: getAuthHeaders` to supply its current Better Auth `Cookie` header and `credentials: 'omit'`. Cookie storage and browser CORS policy belong to the runtime/server.
- `onUnauthorized` runs once per HTTP 401, even for empty or malformed responses, and is awaited. It is not called for 403 or an error envelope with HTTP 200. Header/token provider and callback exceptions reject unchanged; hooks should handle their own recovery if necessary. There is no cross-request deduplication.

## Results, envelopes, and cancellation

```ts
type ApiResult<T> =
  | { error: false; data: T; errorDetails: null }
  | {
      error: true;
      data: null;
      errorDetails: {
        title: string;
        message: string;
        status?: number;
      };
    };
```

The server generator uses `{ success: true, data: T }` and `{ success: false, error: { code: string, message: string, details?: unknown } }`. There is no dependency on the server package. Paginators stay inside `data` as `{ items, total, page, limit, totalPages }`; the fetcher does not flatten or rename those fields.

`responseMode` controls successful JSON decoding:

| Mode             | Behavior                                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auto` (default) | Recognizes exactly the server envelope shapes and otherwise returns the complete JSON payload. This supports both existing direct-JSON fixtures and server templates.       |
| `json`           | Returns the complete payload, including objects that exactly coincide with server success/failure envelopes. Use for application or provider APIs with such domain objects. |
| `envelope`       | Requires an exact server success/failure envelope; other JSON returns an `Invalid response` failure.                                                                        |

Recognition requires exactly `success` and `data`, or exactly `success` and `error`. The error object requires string `code` and `message`, with only optional `details` (any value, including null). Extra keys, missing fields, wrong discriminants, and malformed errors do not count as envelopes. A domain payload `{ success: true, data: value, id: 'domain' }` stays intact in `auto`. A payload with **exactly** `{ success: true, data: value }` cannot be distinguished from the wire protocol and is unwrapped in `auto`; choose `json` to preserve it. Unwrapping occurs only once. In `auto`, malformed envelope-like objects remain direct JSON; choose `envelope` to reject them. Types cannot validate the JSON received at runtime.

All HTTP non-2xx responses remain failures in every mode, even if their body claims success. Exact error envelopes map `code` to `title` and preserve `message`; other JSON errors accept `title` plus `message`/problem `detail`. Text errors use the text as their message. Missing error information falls back to `statusText` or `HTTP <status>`. `status` always comes from HTTP, never from the body; optional `details` from recognized error envelopes or direct JSON errors are preserved as `unknown` in `errorDetails.details`, including null. The same metadata remains available on `ApiError.errorDetails.details` after `unwrap`; callers must narrow it before mapping validated server paths to form fields.

Empty successful bodies (including 204/205) yield `undefined`; use `<void>` for bodyless endpoints. Nonempty bodies are parsed as JSON regardless of their content-type to accommodate JSON peers with missing headers. Non-JSON or malformed successful bodies return an `Invalid response` failure with the HTTP status. This client does not return text/blobs. Body stream failures return a `Response error` with the received status. Network failures return a `Network error` without inventing an HTTP status.

`signal` is forwarded to Fetch. Pre-aborted requests and cancellation during Fetch/body consumption reject with the native abort reason, unchanged by `unwrap`; cancellation is not an `ApiError`. The signal is checked before auth providers and again after they resolve. Providers themselves are not interrupted by the signal, so a pending provider must settle before that second check. `unwrap` passes through any existing promise rejection.

`new ApiError(errorDetails)` extends `Error`, sets `name: 'ApiError'`, and exposes `message`, `title`, `status?`, and the original `errorDetails`.

## OpenAPI domain types

The stack expects application aliases in `@/types/main-api-types`. Helpers operate on generated `paths` from [openapi-typescript](https://openapi-ts.dev/advanced), without a runtime schema dependency:

```ts
import type { paths } from "./generated/openapi.js";
import type {
  GetResponse,
  GetQuery,
  PostBody,
  PatchBody,
} from "@alot-web-develop/api";

export type TOrder = GetResponse<paths, "/orders/{id}">;
export type TOrderListResponse = GetResponse<paths, "/orders">;
export type TOrderListQuery = GetQuery<paths, "/orders">;
export type TCreateOrderRequest = PostBody<paths, "/orders">;
export type TUpdateOrderRequest = PatchBody<paths, "/orders/{id}">;
```

Exports: `GetResponse`, `PostResponse`, `PutResponse`, `PatchResponse`, `DeleteResponse`, `GetQuery`, `PostBody`, `PutBody`, `PatchBody`, and `ResponseData<Payload, Mode = 'auto'>`. Path/method mismatches fail compilation, including optional `never` methods. Body/query helpers return the corresponding JSON request body/query object (excluding optional outer undefined); absent bodies/queries yield `never`.

Response helpers combine all declared 2xx statuses (numeric, string, and `2XX`) and select `application/json` or `+json` content. Bodyless responses yield `void`; unsupported non-JSON content and error-only responses yield `never`. HTTP errors/default responses are not domain data. Exact server success envelopes yield their `data` type; exact error envelopes have no successful data type. Direct payloads and objects with extra keys remain intact. For a `json` client, use the third response-helper argument, e.g. `GetResponse<paths, '/orders', 'json'>`. Use `'envelope'` to mirror strict mode. Schemas should describe the exact wire object: optional extra keys/index signatures cannot express which keys are present in a particular runtime response.

Decisions follow the existing generator contracts, the [Fetch standard](https://fetch.spec.whatwg.org/) (HTTP vs network errors, credentials, abort semantics), and the [URL standard](https://url.spec.whatwg.org/) (query encoding). Generating OpenAPI files or a CLI is outside this package.

## Validation

From the workspace root, with Node 24 and pnpm 12:

```sh
pnpm install
pnpm check
pnpm --filter @alot-web-develop/api test:integration
```

Unit tests cover HTTP methods, URL/query behavior, auth/header refresh, credentials, envelope collisions, strict/direct decoding, empty/non-JSON bodies, HTTP/network/stream errors, cancellation, and compile-time OpenAPI extraction. The integration check packs the built package, installs that tarball offline into a temporary consumer, compiles the actual client/service templates for React, React Native and Svelte with strict TypeScript, checks compatibility with all three fixture contracts, and executes their CRUD calls against a real local HTTP server. It exercises server envelopes/pagination, cookie/bearer headers, 401/404, 204, and cancellation. It installs no framework/UI dependencies and cleans up its own temporary directory.


## Uploads

```ts
const form = new FormData();
form.append("file", file);
form.append("folder", "avatars");
await unwrap(api.post("/uploads", { body: form, signal }));
```

For raw file endpoints use a `Blob`/`File` body with `put` or `post`. Responses
still follow the JSON/envelope or empty-body contract. Fetch provides cancellation;
this wrapper does not implement upload progress or signed-URL generation.
File validation and FormData helpers belong in `utils`; authorization and transport
remain in this package. `FormData` depends on the host implementation (browser,
Node or React Native polyfill). Header handling follows [MDN's FormData guidance](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects).

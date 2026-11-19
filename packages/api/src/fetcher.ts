import { performFetch, prepareRequest } from "./fetcher/request.js";
import { requestUrl } from "./fetcher/url.js";
import { readResponse } from "./response.js";
import { failure } from "./result.js";
import type {
  ApiClient,
  ApiResult,
  FetcherConfig,
  RequestOptions,
} from "./types.js";

function assertHttpBaseUrl(base: URL): void {
  const isHttp = base.protocol === "http:" || base.protocol === "https:";
  if (!isHttp) {
    throw new TypeError("baseUrl must be an absolute HTTP(S) URL");
  }
}

/**
 * Confirms an abort did not occur, then returns the failure result for a
 * response that could not be read.
 */
function readFailure<T>(
  error: unknown,
  signal: AbortSignal | undefined,
  status: number,
): ApiResult<T> {
  signal?.throwIfAborted();
  if (error instanceof Error && error.name === "AbortError") throw error;
  return failure(
    "Response error",
    error instanceof Error ? error.message : "Could not read response body",
    status,
  );
}

/**
 * Creates a typed HTTP client backed by `fetch`.
 *
 * Each method returns an {@link ApiResult} rather than throwing on network or
 * non-2xx responses; only aborts and unauthorized hooks propagate. JSON is the
 * default content type when neither a native body nor an explicit header is
 * supplied.
 *
 * @param config - Base URL, auth, header, and response-mode configuration.
 * @returns An {@link ApiClient} exposing `get`/`post`/`put`/`patch`/`delete`.
 */
export function createFetcher(config: FetcherConfig): ApiClient {
  const base = new URL(config.baseUrl);
  assertHttpBaseUrl(base);
  const mode = config.responseMode ?? "auto";

  const request = async <T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResult<T>> => {
    options.signal?.throwIfAborted();
    const url = requestUrl(base, path, options.query);
    const prepared = await prepareRequest(config, options);

    options.signal?.throwIfAborted();
    const fetched = await performFetch(url, method, prepared, options.signal);
    if (fetched.error) return fetched;

    const response = fetched.data;
    // Hook failures are application errors and reject unchanged.
    if (response.status === 401) await config.onUnauthorized?.();

    try {
      return await readResponse<T>(response, mode);
    } catch (error) {
      return readFailure<T>(error, options.signal, response.status);
    }
  };

  return {
    get: (path, options) => request("GET", path, options),
    post: (path, options) => request("POST", path, options),
    put: (path, options) => request("PUT", path, options),
    patch: (path, options) => request("PATCH", path, options),
    delete: (path, options) => request("DELETE", path, options),
  };
}

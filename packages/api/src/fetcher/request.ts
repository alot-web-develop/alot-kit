import { failure } from "../result.js";
import type { ApiResult, FetcherConfig, RequestOptions } from "../types.js";

type PreparedRequest = {
  headers: Headers;
  body: BodyInit | undefined;
  credentials: RequestCredentials | undefined;
};

/**
 * Performs an `instanceof` check against a constructor that may be absent in
 * the current runtime (Node/SSR without the browser globals).
 */
function isInstanceOfGuard(
  value: unknown,
  ctor: (abstract new (...args: never[]) => unknown) | undefined,
): boolean {
  return ctor !== undefined && value instanceof ctor;
}

/** Whether a value is a native body accepted directly by `fetch`. */
function isNativeBody(value: unknown): value is BodyInit {
  const constructors = [
    typeof FormData !== "undefined" ? FormData : undefined,
    typeof Blob !== "undefined" ? Blob : undefined,
    typeof URLSearchParams !== "undefined" ? URLSearchParams : undefined,
  ];

  if (constructors.some((ctor) => isInstanceOfGuard(value, ctor))) {
    return true;
  }
  return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}

/** Adds `Bearer` authorization when a token is available and not already set. */
function applyAuthorization(headers: Headers, token?: string | null): void {
  if (token) headers.set("authorization", `Bearer ${token}`);
}

/** Ensures a JSON accept header is present when the caller did not set one. */
function ensureAcceptHeader(headers: Headers): void {
  if (!headers.has("accept")) headers.set("accept", "application/json");
}

/**
 * Serializes the request body: native bodies pass through unchanged, while
 * plain values are JSON-encoded. Sets the content type accordingly.
 */
function prepareBody(headers: Headers, body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;

  if (isNativeBody(body)) {
    // Fetch generates the multipart boundary itself; a JSON header must not
    // override it for FormData bodies.
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      headers.delete("content-type");
    }
    return body;
  }

  const isJson = !headers.has("content-type");
  if (isJson) headers.set("content-type", "application/json");
  return JSON.stringify(body);
}

/**
 * Resolves headers from the static or factory config, applies auth and accept
 * defaults, then serializes the body.
 */
async function prepareRequest(
  config: FetcherConfig,
  options: RequestOptions,
): Promise<PreparedRequest> {
  const headers = new Headers(
    typeof config.headers === "function"
      ? await config.headers()
      : config.headers,
  );
  const token = await config.getToken?.();
  applyAuthorization(headers, token);
  ensureAcceptHeader(headers);

  return {
    headers,
    body: prepareBody(headers, options.body),
    credentials: config.credentials,
  };
}

/** Distinguishes a genuine abort from a generic network failure. */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Executes the underlying `fetch` call, converting network failures into a
 * result and rethrowing aborts so callers can react to cancellation.
 */
async function performFetch(
  url: URL,
  method: string,
  prepared: PreparedRequest,
  signal?: AbortSignal,
): Promise<ApiResult<Response>> {
  try {
    const response = await fetch(url, {
      method,
      headers: prepared.headers,
      body: prepared.body,
      signal,
      ...(prepared.credentials === undefined
        ? {}
        : { credentials: prepared.credentials }),
    });
    return { error: false, data: response, errorDetails: null };
  } catch (error) {
    signal?.throwIfAborted();
    if (isAbortError(error)) throw error;
    return failure(
      "Network error",
      error instanceof Error ? error.message : "Request failed",
    );
  }
}

export { isAbortError, isNativeBody, performFetch, prepareRequest };

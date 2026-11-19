import { failure } from "./result.js";
import type { ApiResult, ResponseMode } from "./types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const onlyKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).every((key) => keys.includes(key));

function isSuccess(value: unknown): value is { success: true; data: unknown } {
  return (
    isRecord(value) &&
    value.success === true &&
    Object.hasOwn(value, "data") &&
    onlyKeys(value, ["success", "data"])
  );
}

function isFailure(value: unknown): value is {
  success: false;
  error: { code: string; message: string; details?: unknown };
} {
  return (
    isRecord(value) &&
    value.success === false &&
    onlyKeys(value, ["success", "error"]) &&
    isRecord(value.error) &&
    typeof value.error.code === "string" &&
    typeof value.error.message === "string" &&
    onlyKeys(value.error, ["code", "message", "details"])
  );
}

/** Reads the body text, returning the parsed payload and whether it was JSON. */
async function readBody(response: Response): Promise<{
  text: string;
  payload: unknown;
  validJson: boolean;
}> {
  const text = await response.text();
  if (text === "") return { text, payload: undefined, validJson: false };

  try {
    return { text, payload: JSON.parse(text), validJson: true };
  } catch {
    // Non-JSON errors still carry their HTTP status and text message.
    return { text, payload: undefined, validJson: false };
  }
}

/**
 * Resolves the user-facing message from a non-2xx payload, falling back to
 * API error fields, RFC 9457 problem details, then the raw text or status.
 */
function resolveErrorMessage(
  payload: unknown,
  text: string,
  title: string,
): string {
  if (!isRecord(payload)) return text || title;
  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.detail === "string") return payload.detail;
  return title;
}

/** Resolves the error title from a problem-details payload, else the status. */
function resolveErrorTitle(payload: unknown, title: string): string {
  if (isRecord(payload) && typeof payload.title === "string") {
    return payload.title;
  }
  return title;
}

/** Builds the failure result for a non-2xx HTTP response. */
function httpFailure<T>(
  payload: unknown,
  text: string,
  response: Response,
): ApiResult<T> {
  const title = response.statusText || `HTTP ${response.status}`;
  if (isFailure(payload)) {
    return failure(
      payload.error.code,
      payload.error.message,
      response.status,
      payload.error.details,
    );
  }
  return failure(
    resolveErrorTitle(payload, title),
    resolveErrorMessage(payload, text, title),
    response.status,
    isRecord(payload) ? payload.details : undefined,
  );
}

/** Read once so empty bodies and non-JSON HTTP failures remain meaningful. */
export async function readResponse<T>(
  response: Response,
  mode: ResponseMode,
): Promise<ApiResult<T>> {
  const { text, payload, validJson } = await readBody(response);

  if (!response.ok) {
    return httpFailure<T>(payload, text, response);
  }

  if (text === "") {
    return { error: false, data: undefined as T, errorDetails: null };
  }
  if (!validJson) {
    return failure(
      "Invalid response",
      "Expected a JSON response",
      response.status,
    );
  }
  if (mode === "json") {
    return { error: false, data: payload as T, errorDetails: null };
  }

  if (isFailure(payload)) {
    return failure(
      payload.error.code,
      payload.error.message,
      response.status,
      payload.error.details,
    );
  }
  if (isSuccess(payload)) {
    return { error: false, data: payload.data as T, errorDetails: null };
  }
  if (mode === "envelope") {
    return failure(
      "Invalid response",
      "Expected an exact API success or error envelope",
      response.status,
    );
  }

  return { error: false, data: payload as T, errorDetails: null };
}

import type { ApiErrorDetails, ApiResult } from "./types.js";

/** Error thrown by {@link unwrap} when a result represents a failure. */
export class ApiError extends Error {
  readonly title: string;
  readonly status?: number;
  readonly errorDetails: ApiErrorDetails;

  constructor(errorDetails: ApiErrorDetails) {
    super(errorDetails.message);
    this.name = "ApiError";
    this.title = errorDetails.title;
    this.status = errorDetails.status;
    this.errorDetails = errorDetails;
  }
}

/**
 * Awaits a result and unwraps its payload, throwing an {@link ApiError} when
 * the result represents a failure.
 *
 * @param result - The result promise to unwrap.
 * @returns The data payload on success.
 * @throws {@link ApiError} when the result is an error.
 */
export async function unwrap<T>(result: Promise<ApiResult<T>>): Promise<T> {
  const resolved = await result;
  if (resolved.error) throw new ApiError(resolved.errorDetails);
  return resolved.data;
}

/**
 * Builds a failure result, omitting `status` when it is not supplied.
 *
 * @param title - Short error title.
 * @param message - Human-readable error message.
 * @param status - Optional HTTP status code.
 * @returns A failure result with no data payload.
 */
export function failure(
  title: string,
  message: string,
  status?: number,
  details?: unknown,
): ApiResult<never> {
  return {
    error: true,
    data: null,
    errorDetails: {
      title,
      message,
      ...(status === undefined ? {} : { status }),
      ...(details === undefined ? {} : { details }),
    },
  };
}

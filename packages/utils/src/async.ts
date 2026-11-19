export {
  type DebouncedFunction,
  type DebounceOptions,
  debounce,
  type ThrottledFunction,
  type ThrottleOptions,
  throttle,
} from "es-toolkit/function";

/**
 * Resolves after a delay, optionally abortable via an `AbortSignal`. On abort
 * the promise rejects with `signal.reason` and the timer/listener are released.
 *
 * @param milliseconds - Delay in milliseconds (0 to 2147483647).
 * @param signal - Optional abort signal.
 * @returns A promise resolving after the delay.
 */
export function sleep(
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  if (
    !Number.isFinite(milliseconds) ||
    milliseconds < 0 ||
    milliseconds > 2_147_483_647
  ) {
    throw new RangeError(
      "Expected a delay between 0 and 2147483647 milliseconds",
    );
  }
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

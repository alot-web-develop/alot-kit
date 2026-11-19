export type ApiResult<T> =
  | { error: false; data: T; errorDetails: null }
  | { error: true; data: null; errorDetails: { title: string; message: string; status?: number } };
type Options = { query?: object; body?: unknown; signal?: AbortSignal };
interface FetcherConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void | Promise<void>;
  headers?: HeadersInit;
}
class ApiError extends Error {
  constructor(readonly errorDetails: { title: string; message: string; status?: number }) {
    super(errorDetails.message);
  }
}
const createFetcher = (config: FetcherConfig) => {
  const request = async <T>(method: string, path: string, options?: Options): Promise<ApiResult<T>> => {
    const url = new URL(config.baseUrl.replace(/\/$/, '') + path);
    for (const [key, value] of Object.entries(options?.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers = new Headers(config.headers);
    const token = await config.getToken?.();
    if (token) headers.set('authorization', `Bearer ${token}`);
    if (options?.body !== undefined) headers.set('content-type', 'application/json');
    const response = await fetch(url, { method, headers, body: options?.body === undefined ? undefined : JSON.stringify(options.body), signal: options?.signal });
    if (response.status === 401) await config.onUnauthorized?.();
    if (!response.ok) return { error: true, data: null, errorDetails: { title: response.statusText, message: response.statusText, status: response.status } };
    return { error: false, data: response.status === 204 ? undefined as T : await response.json() as T, errorDetails: null };
  };
  return {
    get: <T>(path: string, options?: Options) => request<T>('GET', path, options),
    post: <T>(path: string, options?: Options) => request<T>('POST', path, options),
    put: <T>(path: string, options?: Options) => request<T>('PUT', path, options),
    patch: <T>(path: string, options?: Options) => request<T>('PATCH', path, options),
    delete: <T>(path: string, options?: Options) => request<T>('DELETE', path, options),
  };
};
const unwrap = async <T>(result: Promise<ApiResult<T>>): Promise<T> => {
  const resolved = await result;
  if (resolved.error) throw new ApiError(resolved.errorDetails);
  return resolved.data;
};

export { ApiError, createFetcher, unwrap };

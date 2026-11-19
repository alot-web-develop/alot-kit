export interface ApiErrorDetails {
  title: string;
  message: string;
  status?: number;
  details?: unknown;
}

export type ApiResult<T> =
  | { error: false; data: T; errorDetails: null }
  | { error: true; data: null; errorDetails: ApiErrorDetails };

export type ResponseMode = "auto" | "json" | "envelope";

export interface RequestOptions {
  /** Flat query values; arrays use repeated keys, null/undefined are omitted. */
  query?: object;
  /** JSON values, or native FormData/Blob/URLSearchParams/ArrayBuffer/typed-array bodies. */
  body?: unknown;
  signal?: AbortSignal;
}

export interface FetcherConfig {
  /** Absolute HTTP(S) URL. Its pathname is retained as the API prefix. */
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void | Promise<void>;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  /** Omitted by default, preserving Fetch's same-origin behavior. */
  credentials?: RequestCredentials;
  /** auto recognizes exact kit envelopes; json preserves collisions. */
  responseMode?: ResponseMode;
}

export interface ApiClient {
  get<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>>;
  post<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>>;
  put<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>>;
  patch<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>>;
  delete<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>>;
}

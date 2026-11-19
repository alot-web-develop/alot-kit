export type ApiResult<T> =
  | { error: false; data: T; errorDetails: null }
  | { error: true; data: null; errorDetails: { title: string; message: string; status?: number } };
type Opts = { query?: object; body?: unknown; signal?: AbortSignal };
export interface ApiClient {
  get<T>(path: string, opts?: Opts): Promise<ApiResult<T>>;
  post<T>(path: string, opts?: Opts): Promise<ApiResult<T>>;
  put<T>(path: string, opts?: Opts): Promise<ApiResult<T>>;
  patch<T>(path: string, opts?: Opts): Promise<ApiResult<T>>;
  delete<T>(path: string, opts?: Opts): Promise<ApiResult<T>>;
}
export declare class ApiError extends Error {
  status?: number;
}
export declare const createFetcher: (config: {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  credentials?: RequestCredentials;
}) => ApiClient;
export declare const unwrap: <T>(result: Promise<ApiResult<T>>) => Promise<T>;

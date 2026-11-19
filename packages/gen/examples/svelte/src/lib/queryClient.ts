import { MutationCache, QueryCache, QueryClient } from '@tanstack/svelte-query';
import { toast } from 'svelte-sonner';

const getStatus = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) return undefined;
  if ('status' in error && typeof error.status === 'number') return error.status;
  if ('errorDetails' in error) return getStatus(error.errorDetails);
  return undefined;
};

const reportError = (error: unknown) => {
  toast.error(error instanceof Error ? error.message : String(error));
};

const shouldRetry = (failureCount: number, error: unknown) => {
  const status = getStatus(error);
  return !(status !== undefined && status >= 400 && status < 500) && failureCount < 2;
};

const createQueryClient = () => new QueryClient({
  queryCache: new QueryCache({ onError: reportError }),
  mutationCache: new MutationCache({ onError: reportError }),
  defaultOptions: { queries: { staleTime: 60_000, retry: shouldRetry }, mutations: { retry: false } },
});

export { createQueryClient, shouldRetry };

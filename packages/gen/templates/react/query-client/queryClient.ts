import { ApiError } from '@alot-web-develop/api';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const STALE_TIME_MS = 30_000;
const MAX_RETRIES = 3;

const isClientError = (error: Error) =>
  error instanceof ApiError && error.status !== undefined && error.status >= 400 && error.status < 500;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) toast.error(error.message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(error.message),
  }),
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      retry: (failureCount, error) => !isClientError(error) && failureCount < MAX_RETRIES,
    },
  },
});

export { queryClient };

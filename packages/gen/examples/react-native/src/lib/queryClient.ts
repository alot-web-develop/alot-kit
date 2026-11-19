import { ApiError } from '@alot-web-develop/api';
import { toast } from '@alot-web-develop/ui-native/toast';
import { focusManager, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

const STALE_TIME_MS = 60_000;
const MAX_RETRIES = 2;

const isClientError = (error: unknown) =>
  error instanceof ApiError && error.status !== undefined && error.status >= 400 && error.status < 500;

const getMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unexpected error');

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
  return () => subscription.remove();
});

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toast.error(getMessage(error)),
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(getMessage(error)),
  }),
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      retry: (failureCount, error) => !isClientError(error) && failureCount < MAX_RETRIES,
    },
    mutations: {
      retry: false,
    },
  },
});

export { queryClient };

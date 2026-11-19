import { createFetcher } from '@alot-web-develop/api';
import { env } from '@/config/env';
import { getAuthHeaders, signOut } from '@/lib/auth';

const api = createFetcher({
  baseUrl: env.EXPO_PUBLIC_API_URL,
  credentials: 'omit',
  headers: getAuthHeaders,
  onUnauthorized: () => {
    void signOut();
  },
});

export { api };

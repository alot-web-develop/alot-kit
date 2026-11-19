import { createFetcher } from '@alot-web-develop/api';
import { env } from '@/config/env';
import { getToken, signOut } from '@/lib/auth';

const api = createFetcher({
  baseUrl: env.apiUrl,
  credentials: 'include',
  getToken,
  onUnauthorized: () => {
    void signOut();
  },
});

export { api };

import { createFetcher } from '@alot-web-develop/api';
import { env } from '@/config/env';
import { getToken, signOut } from '@/lib/auth';
const api = createFetcher({ baseUrl: env.PUBLIC_API_URL, getToken, onUnauthorized: signOut });
export { api };

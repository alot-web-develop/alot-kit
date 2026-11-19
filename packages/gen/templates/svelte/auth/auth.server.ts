import { createAuthClient } from 'better-auth/client';
import { jwtClient } from 'better-auth/client/plugins';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import { env } from '@/config/env';
import type { Session } from './auth';

type ServerAuthEvent = Pick<RequestEvent, 'fetch' | 'request'>;
interface ServerAuthAdapter {
  getSession: (event: ServerAuthEvent) => Promise<Session | null>;
  getToken: (event: ServerAuthEvent) => Promise<string | null>;
}

const createServerAuth = (event: ServerAuthEvent) => createAuthClient({
  baseURL: env.PUBLIC_API_URL,
  plugins: [jwtClient()],
  fetchOptions: { customFetchImpl: event.fetch, headers: { cookie: event.request.headers.get('cookie') ?? '' } },
});

const betterAuthServerAdapter: ServerAuthAdapter = {
  getSession: async (event) => {
    const result = await createServerAuth(event).getSession();
    if (result.error && result.error.status !== 401) throw new Error(result.error.message);
    return result.data;
  },
  getToken: async (event) => {
    const result = await createServerAuth(event).token();
    if (result.error) {
      if (result.error.status === 401) return null;
      throw new Error(result.error.message);
    }
    return result.data?.token ?? null;
  },
};
const serverAuthAdapter: ServerAuthAdapter = betterAuthServerAdapter;

const requireSession = async (event: ServerAuthEvent & Pick<RequestEvent, 'url'>) => {
  const session = await serverAuthAdapter.getSession(event);
  if (!session) redirect(303, `/login?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`);
  return session;
};

export { createServerAuth, betterAuthServerAdapter, serverAuthAdapter, requireSession };
export type { ServerAuthEvent, ServerAuthAdapter };

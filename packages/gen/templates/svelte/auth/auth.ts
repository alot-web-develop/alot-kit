import { createAuthClient } from 'better-auth/svelte';
import { jwtClient } from 'better-auth/client/plugins';
import { fromStore } from 'svelte/store';
import { env } from '@/config/env';

interface Session { user: { id: string; name: string; email: string }; session: { id: string; expiresAt: Date } }
interface SessionState { data: Session | null; isPending: boolean; error: { message?: string } | null }
interface Credentials { email: string; password: string }
interface AuthAdapter {
  useSession: () => { readonly current: SessionState };
  signIn: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const client = createAuthClient({ baseURL: env.PUBLIC_API_URL, plugins: [jwtClient()] });
const betterAuthAdapter: AuthAdapter = {
  useSession: () => fromStore(client.useSession()),
  signIn: async (credentials) => {
    const result = await client.signIn.email(credentials);
    if (result.error) throw new Error(result.error.message);
  },
  signOut: async () => {
    const result = await client.signOut();
    if (result.error) throw new Error(result.error.message);
  },
  getToken: async () => {
    const result = await client.token();
    if (result.error) {
      if (result.error.status === 401) return null;
      throw new Error(result.error.message);
    }
    return result.data?.token ?? null;
  },
};

const authAdapter: AuthAdapter = betterAuthAdapter;
const useSession = () => authAdapter.useSession();
const signIn = (credentials: Credentials) => authAdapter.signIn(credentials);
const signOut = () => authAdapter.signOut();
const getToken = () => authAdapter.getToken();

export { authAdapter, betterAuthAdapter, useSession, signIn, signOut, getToken };
export type { Session, SessionState, Credentials, AuthAdapter };

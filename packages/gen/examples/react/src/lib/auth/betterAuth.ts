import type { ReactNode } from 'react';
import { createAuthClient } from 'better-auth/react';
import { env } from '@/config/env';
import type { AuthAdapter, TAuthSession, TSignInCredentials } from './types';

const authClient = createAuthClient({ baseURL: env.authUrl });

const BetterAuthProvider = ({ children }: { children: ReactNode }) => children;

const useBetterAuthSession = (): TAuthSession => {
  const { data, isPending } = authClient.useSession();

  return { user: data?.user ?? null, isPending };
};

const signInWithEmail = async (credentials: TSignInCredentials) => {
  const { error } = await authClient.signIn.email(credentials);

  if (error) throw new Error(error.message ?? error.statusText);
};

const betterAuthAdapter: AuthAdapter = {
  Provider: BetterAuthProvider,
  useSession: useBetterAuthSession,
  signIn: signInWithEmail,
  signOut: async () => {
    await authClient.signOut();
  },
  getToken: async () => null,
};

export { betterAuthAdapter };

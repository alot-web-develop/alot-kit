import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { env } from '@/config/env';
import type { TAuthAdapter } from './types';

const authClient = createAuthClient({
  baseURL: env.EXPO_PUBLIC_API_URL,
  plugins: [
    expoClient({
      scheme: env.EXPO_PUBLIC_APP_SCHEME,
      storagePrefix: env.EXPO_PUBLIC_APP_SCHEME,
      storage: SecureStore,
    }),
  ],
});

const betterAuthAdapter: TAuthAdapter = {
  useSession: () => {
    const { data, isPending } = authClient.useSession();
    return {
      user: data ? { id: data.user.id, email: data.user.email, name: data.user.name } : null,
      isPending,
    };
  },
  signIn: async ({ email, password }) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message ?? 'Sign in failed');
  },
  signOut: async () => {
    await authClient.signOut();
  },
  getToken: async () => null,
  getAuthHeaders: async (): Promise<Record<string, string>> => {
    const cookie = await authClient.getCookie();
    return cookie ? { Cookie: cookie } : {};
  },
};

export { authClient, betterAuthAdapter };

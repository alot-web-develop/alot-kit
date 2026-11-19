import { betterAuthAdapter } from './betterAuth';
import type { AuthAdapter } from './types';

const auth: AuthAdapter = betterAuthAdapter;

const { Provider: AuthProvider, useSession, signIn, signOut, getToken } = auth;

export type { AuthAdapter, TAuthSession, TAuthUser, TSignInCredentials } from './types';
export { AuthProvider, getToken, signIn, signOut, useSession };

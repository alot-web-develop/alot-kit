import { betterAuthAdapter } from './betterAuth';
import type { AuthAdapter } from './types';

const auth: AuthAdapter = betterAuthAdapter;

const { Provider: AuthProvider, useSession, signIn, signOut, getToken } = auth;

export { AuthProvider, useSession, signIn, signOut, getToken };
export type { AuthAdapter, TAuthSession, TAuthUser, TSignInCredentials } from './types';

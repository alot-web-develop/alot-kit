import { betterAuthAdapter } from './betterAuth';

const { useSession, signIn, signOut, getToken, getAuthHeaders } = betterAuthAdapter;

export { RequireAuth } from './RequireAuth';
export { useSession, signIn, signOut, getToken, getAuthHeaders };
export type { TAuthAdapter, TAuthSession, TAuthUser, TSignInInput } from './types';

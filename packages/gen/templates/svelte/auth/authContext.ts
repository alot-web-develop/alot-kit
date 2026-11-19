import { getContext, setContext } from 'svelte';
import type { AuthAdapter } from './auth';

interface AuthContext extends Omit<AuthAdapter, 'useSession'> { readonly session: ReturnType<AuthAdapter['useSession']>['current'] }
const authKey = Symbol('auth');
const provideAuth = (value: AuthContext) => setContext(authKey, value);
const useAuth = (): AuthContext => {
  const value = getContext<AuthContext | undefined>(authKey);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
};

export { provideAuth, useAuth };
export type { AuthContext };

import type { ReactNode } from 'react';

type TAuthUser = {
  id: string;
  email: string;
  name: string;
};

type TAuthSession = {
  user: TAuthUser | null;
  isPending: boolean;
};

type TSignInCredentials = {
  email: string;
  password: string;
};

interface AuthAdapter {
  Provider: (props: { children: ReactNode }) => ReactNode;
  useSession: () => TAuthSession;
  signIn: (credentials: TSignInCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export type { AuthAdapter, TAuthSession, TAuthUser, TSignInCredentials };

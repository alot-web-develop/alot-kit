interface TAuthUser {
  id: string;
  email: string;
  name: string;
}

interface TSignInInput {
  email: string;
  password: string;
}

interface TAuthSession {
  user: TAuthUser | null;
  isPending: boolean;
}

interface TAuthAdapter {
  useSession: () => TAuthSession;
  signIn: (input: TSignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

export type { TAuthAdapter, TAuthSession, TAuthUser, TSignInInput };

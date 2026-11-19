import type { TAuthAdapter, TAuthUser } from '@alot-web-develop/server';

const TEST_USERS = {
  user: { id: 'user-1', email: 'user@example.test', role: 'user' },
  other: { id: 'user-2', email: 'other@example.test', role: 'user' },
  admin: { id: 'admin-1', email: 'admin@example.test', role: 'admin' },
} satisfies Record<string, TAuthUser>;

type TTestUser = keyof typeof TEST_USERS;

const sessions = new Map<string, TAuthUser>(Object.entries(TEST_USERS));

const testAuthAdapter: TAuthAdapter = {
  getUser: async (request) => {
    const token = request.headers.authorization?.replace(/^Bearer /, '') ?? '';
    return sessions.get(token) ?? null;
  },
};

const authHeader = (user: TTestUser) => ({ authorization: `Bearer ${user}` });

export { TEST_USERS, authHeader, testAuthAdapter };
export type { TTestUser };

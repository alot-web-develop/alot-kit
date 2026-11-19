import Fastify from 'fastify';
import { type TAuthUser, authPlugin, currentUser, errorHandler, protectedScope, requireRole } from '@alot-web-develop/server';
import { afterEach, expect, test, vi } from 'vitest';

const user = { id: 'alice', email: 'alice@example.test', role: 'user' };
afterEach(() => { vi.clearAllMocks(); });

test('validates cookie and bearer sessions through the adapter', async () => {
  const getUser = vi.fn(async (): Promise<TAuthUser | null> => user);
  const app = Fastify();
  app.setErrorHandler(errorHandler);
  await app.register(authPlugin, { adapter: { getUser } });
  await app.register(protectedScope(async (scope) => {
    scope.get('/private', async (request) => currentUser(request));
    scope.get('/admin', { preHandler: requireRole('admin') }, async () => ({ ok: true }));
  }));
  try {
    for (const headers of [{ cookie: 'session=valid' }, { authorization: 'Bearer valid' }]) {
      const response = await app.inject({ url: '/private', headers });
      expect(response.statusCode).toBe(200);
      expect(response.json().id).toBe('alice');
    }
    expect(getUser).toHaveBeenCalledTimes(2);
    getUser.mockResolvedValueOnce(null);
    expect((await app.inject({ url: '/private', headers: { cookie: 'session=expired' } })).statusCode).toBe(401);
    expect((await app.inject({ url: '/admin', headers: { cookie: 'session=valid' } })).statusCode).toBe(403);
  } finally { await app.close(); }
});

import { beforeEach, expect, test, vi } from 'vitest';
import { createAuthClient } from 'better-auth/client';
import { createServerAuth, requireSession } from '@/lib/auth.server';

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('better-auth/client', () => ({ createAuthClient: vi.fn(() => ({ getSession })) }));
const event = (cookie = 'session=alice') => ({ request: new Request('https://app.example/orders?page=2', { headers: { cookie } }), fetch: vi.fn<typeof fetch>(), url: new URL('https://app.example/orders?page=2') });
beforeEach(() => { vi.clearAllMocks(); });

test('creates request-scoped auth with the current fetch and cookies', () => {
  const alice = event();
  const bob = event('session=bob');
  createServerAuth(alice);
  createServerAuth(bob);
  const calls = vi.mocked(createAuthClient).mock.calls;
  expect(calls[0][0]?.fetchOptions?.headers).toEqual({ cookie: 'session=alice' });
  expect(calls[0][0]?.fetchOptions?.customFetchImpl).toBe(alice.fetch);
  expect(calls[1][0]?.fetchOptions?.headers).toEqual({ cookie: 'session=bob' });
});

test('redirects missing or expired sessions with a return URL', async () => {
  for (const error of [null, { status: 401, message: 'Expired' }]) {
    getSession.mockResolvedValueOnce({ data: null, error });
    await expect(requireSession(event())).rejects.toMatchObject({ status: 303, location: '/login?redirectTo=%2Forders%3Fpage%3D2' });
  }
});

test('returns a session and surfaces auth service failures', async () => {
  const session = { user: { id: 'alice' }, session: { id: 'session' } };
  getSession.mockResolvedValueOnce({ data: session, error: null });
  expect(await requireSession(event())).toBe(session);
  getSession.mockResolvedValueOnce({ data: null, error: { status: 503, message: 'Auth unavailable' } });
  await expect(requireSession(event())).rejects.toThrow('Auth unavailable');
});

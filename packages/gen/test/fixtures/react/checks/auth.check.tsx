import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, test, vi } from 'vitest';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { betterAuthAdapter } from '@/lib/auth/betterAuth';

const { session, email, signOut } = vi.hoisted(() => ({
  session: { user: null as null | { id: string; email: string; name: string }, isPending: true },
  email: vi.fn(), signOut: vi.fn(),
}));
vi.mock('@/config/env', () => ({ env: { authUrl: 'https://auth.example.test' } }));
vi.mock('better-auth/react', () => ({ createAuthClient: () => ({ useSession: () => ({ data: { user: session.user }, isPending: session.isPending }), signIn: { email }, signOut }) }));

beforeEach(() => { session.user = null; session.isPending = true; vi.clearAllMocks(); });

test('hides protected content while loading and when signed out', () => {
  const markup = () => renderToStaticMarkup(<RequireAuth fallback={<span>Sign in</span>} loading={<span>Loading</span>}><span>Private data</span></RequireAuth>);
  expect(markup()).toBe('<span>Loading</span>');
  session.isPending = false;
  expect(markup()).toBe('<span>Sign in</span>');
  session.user = { id: 'alice', email: 'alice@example.test', name: 'Alice' };
  expect(markup()).toBe('<span>Private data</span>');
});

test('surfaces rejected credentials and uses cookie sessions by default', async () => {
  email.mockResolvedValueOnce({ error: { message: 'Invalid credentials', statusText: 'Unauthorized' } });
  await expect(betterAuthAdapter.signIn({ email: 'alice@example.test', password: 'invalid' })).rejects.toThrow('Invalid credentials');
  email.mockResolvedValueOnce({ error: null });
  await expect(betterAuthAdapter.signIn({ email: 'alice@example.test', password: 'valid' })).resolves.toBeUndefined();
  expect(await betterAuthAdapter.getToken()).toBeNull();
});

import { beforeEach, expect, test, vi } from 'vitest';
import { actions, load } from '../src/routes/(protected)/orders/new/+page.server';

const { token, requireSession } = vi.hoisted(() => ({ token: vi.fn(), requireSession: vi.fn() }));
vi.mock('@/lib/auth.server', () => ({ requireSession, serverAuthAdapter: { getToken: token } }));
const event = (values: Record<string, string>) => ({
  request: new Request('https://app.example/orders/new', { method: 'POST', body: new URLSearchParams(values) }),
  url: new URL('https://app.example/orders/new'),
  fetch: globalThis.fetch,
}) as Parameters<typeof actions.default>[0];

beforeEach(() => {
  vi.restoreAllMocks();
  token.mockReset().mockResolvedValue('jwt');
  requireSession.mockReset().mockResolvedValue({ user: { id: 'alice' } });
});

test('validates the schema on the server before any write', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  const invalid: Record<string, string>[] = [{}, { name: '' }, { name: '  ' }];
  for (const values of invalid) {
    const result = await actions.default(event(values));
    expect(result).toMatchObject({ status: 400, data: { form: { valid: false, errors: { name: expect.any(Array) } } } });
  }
  expect(fetch).not.toHaveBeenCalled();
  expect(requireSession).toHaveBeenCalledTimes(3);
});

test('posts validated data with a request-scoped bearer token', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'one', name: 'Alice', createdAt: '2026-01-01' }), { headers: { 'content-type': 'application/json' } }));
  const result = await actions.default(event({ name: ' Alice ' }));
  expect(result).toMatchObject({ form: { valid: true, data: { name: 'Alice' } }, order: { id: 'one' } });
  expect(fetch).toHaveBeenCalledTimes(1);
  const request = fetch.mock.calls[0];
  expect(new Headers(request[1]?.headers).get('authorization')).toBe('Bearer jwt');
  expect(request[1]?.body).toBe(JSON.stringify({ name: 'Alice' }));
});

test('returns backend failures as form errors', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 409, statusText: 'Already exists' }));
  const result = await actions.default(event({ name: 'Alice' }));
  expect(result).toMatchObject({ status: 400, data: { form: { valid: false, errors: { _errors: ['Already exists'] } } } });
});

test('rejects expired auth before writing and guards form loads', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  token.mockResolvedValueOnce(null);
  expect(await actions.default(event({ name: 'Alice' }))).toMatchObject({ status: 401 });
  expect(fetch).not.toHaveBeenCalled();
  requireSession.mockRejectedValueOnce(new Error('Session required'));
  await expect(load({ ...event({}), parent: async () => ({}), depends: () => {}, untrack: (fn) => fn() } as Parameters<typeof load>[0])).rejects.toThrow('Session required');
});

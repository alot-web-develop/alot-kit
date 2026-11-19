import { expect, test } from 'vitest';
import { buildApp } from '../src/app.js';
import { env } from '../src/config/env.js';

test('validates real Better Auth cookies and bearer tokens, rejects role spoofing, and revokes sessions', async () => {
  env.MONGODB_URI = 'mongodb://test-double/auth';
  const { authAdapter } = await import('../src/lib/auth.js');
  const app = await buildApp({ mongoUri: env.MONGODB_URI, auth: authAdapter });
  const origin = { host: 'localhost:4000', origin: 'http://localhost:4000' };
  try {
    const signup = await app.inject({
      method: 'POST', url: `${env.API_PREFIX}/auth/sign-up/email`, headers: origin,
      payload: { name: 'Alice', email: 'alice@example.test', password: 'test-password-for-fixture', role: 'admin' },
    });
    expect(signup.statusCode).toBe(200);
    const setCookies = signup.headers['set-cookie'];
    const cookie = (Array.isArray(setCookies) ? setCookies : [setCookies]).map((value) => value?.split(';')[0]).filter(Boolean).join('; ');
    expect(cookie).toContain('session_token=');
    const bearer = signup.headers['set-auth-token'];
    if (typeof bearer !== 'string') throw new Error('Bearer token header missing');
    for (const headers of [{ ...origin, cookie }, { ...origin, authorization: `Bearer ${bearer}` }]) {
      const list = await app.inject({ url: `${env.API_PREFIX}/orders`, headers });
      expect(list.statusCode).toBe(200);
      const restricted = await app.inject({ method: 'POST', url: `${env.API_PREFIX}/report`, headers, payload: { name: 'Private report' } });
      expect(restricted.statusCode).toBe(403);
    }
    const signOut = await app.inject({ method: 'POST', url: `${env.API_PREFIX}/auth/sign-out`, headers: { ...origin, cookie }, payload: {} });
    expect(signOut.statusCode).toBe(200);
    expect((await app.inject({ url: `${env.API_PREFIX}/orders`, headers: { cookie } })).statusCode).toBe(401);
    expect((await app.inject({ url: `${env.API_PREFIX}/orders`, headers: { authorization: `Bearer ${bearer}` } })).statusCode).toBe(401);
  } finally { await app.close(); }
}, 30_000);

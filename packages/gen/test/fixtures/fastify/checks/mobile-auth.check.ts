import { expect, test } from 'vitest';
import { buildApp } from '../src/app.js';
import { env } from '../src/config/env.js';

const SCHEME = 'alotapp';

const signUp = (app: Awaited<ReturnType<typeof buildApp>>, email: string, expoOrigin: string) =>
  app.inject({
    method: 'POST',
    url: `${env.API_PREFIX}/auth/sign-up/email`,
    headers: { host: 'localhost:4000', 'expo-origin': expoOrigin },
    payload: { name: 'Mobile', email, password: 'test-password-for-fixture', callbackURL: `${expoOrigin}home` },
  });

test('accepts the Expo app scheme as a trusted origin and authenticates its session cookie', async () => {
  env.MONGODB_URI = 'mongodb://test-double/mobile-auth';
  env.MOBILE_APP_SCHEME = SCHEME;
  const { authAdapter } = await import('../src/lib/auth.js');
  const app = await buildApp({ mongoUri: env.MONGODB_URI, auth: authAdapter });
  try {
    const trusted = await signUp(app, 'mobile@example.test', `${SCHEME}://`);
    expect(trusted.statusCode).toBe(200);
    const setCookies = trusted.headers['set-cookie'];
    const cookie = (Array.isArray(setCookies) ? setCookies : [setCookies]).map((value) => value?.split(';')[0]).filter(Boolean).join('; ');
    expect(cookie).toContain('session_token=');
    expect((await app.inject({ url: `${env.API_PREFIX}/orders`, headers: { cookie } })).statusCode).toBe(200);

    const untrusted = await signUp(app, 'other@example.test', 'evilapp://');
    expect(untrusted.statusCode).toBe(403);
  } finally {
    await app.close();
  }
}, 30_000);

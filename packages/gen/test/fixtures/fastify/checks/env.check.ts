import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

test('requires an explicit auth secret', async () => {
  vi.stubEnv('BETTER_AUTH_SECRET', undefined);
  vi.resetModules();
  await expect(import('../src/config/env.js')).rejects.toThrow('BETTER_AUTH_SECRET');
});

test('requires a CORS allowlist in production', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('CORS_ORIGINS', '');
  vi.resetModules();
  await expect(import('../src/config/env.js')).rejects.toThrow('required in production: CORS_ORIGINS');
});

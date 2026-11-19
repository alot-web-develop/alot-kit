import { afterEach, expect, test, vi } from 'vitest';

const r2Keys = ['R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL'];
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

test('accepts blank optional R2 settings from the example environment', async () => {
  for (const key of r2Keys) vi.stubEnv(key, '');
  vi.resetModules();
  const { env } = await import('../src/config/env.js');
  expect(env.R2_ACCOUNT_ID).toBeUndefined();
  expect(env.R2_PUBLIC_URL).toBeUndefined();
});

test('rejects a partially configured R2 account', async () => {
  for (const key of r2Keys) vi.stubEnv(key, '');
  vi.stubEnv('R2_ACCOUNT_ID', 'fixture-account');
  vi.resetModules();
  await expect(import('../src/config/env.js')).rejects.toThrow('must be set together');
});

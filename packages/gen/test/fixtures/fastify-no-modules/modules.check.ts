import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { env } from '../src/config/env.js';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('env exposes no mobile or uploads settings', () => {
  expect(Object.keys(env).filter((key) => key === 'MOBILE_APP_SCHEME' || key.startsWith('R2_'))).toEqual([]);
  expect(read('../src/config/env.ts')).not.toMatch(/MOBILE_APP_SCHEME|R2_/);
  expect(read('../.env.example')).not.toMatch(/MOBILE_APP_SCHEME|R2_/);
});

test('auth does not import the Expo plugin', () => {
  expect(read('../src/lib/auth.ts')).not.toMatch(/@better-auth\/expo|expo\(\)|MOBILE_APP_SCHEME/);
});

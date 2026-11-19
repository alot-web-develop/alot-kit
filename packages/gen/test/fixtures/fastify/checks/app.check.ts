import { afterAll, beforeAll, expect, test } from 'vitest';
import { availability } from '../testing/database.js';
import { buildApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { createTestApp, type TTestApp } from '../test/helpers/app.js';
import { authHeader, testAuthAdapter } from '../test/helpers/auth.js';

let ctx: TTestApp;
beforeAll(async () => { ctx = await createTestApp(); });
afterAll(async () => { await ctx.close(); });

test('matches the frontend API prefix and serves public root probes and OpenAPI schemas', async () => {
  expect(env.API_PREFIX).toBe('/api');
  for (const path of ['/health/live', '/health/ready']) expect((await ctx.app.inject(path)).statusCode).toBe(200);
  const missing = await ctx.app.inject('/missing');
  expect(missing.statusCode).toBe(404);
  expect(missing.json()).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  const response = await ctx.app.inject('/docs/json');
  expect(response.statusCode).toBe(200);
  const spec = response.json();
  for (const path of [`${env.API_PREFIX}/orders/`, `${env.API_PREFIX}/order-items/`, `${env.API_PREFIX}/report/`]) {
    expect(spec.paths[path]).toBeDefined();
    expect(spec.paths[path].post.responses['400']).toBeDefined();
    expect(spec.paths[path].post.responses['401']).toBeDefined();
  }
});

test('rejects foreign updates and deletes without changing the original resource', async () => {
  const path = ctx.url('/orders');
  const created = await ctx.app.inject({ method: 'POST', url: path, headers: authHeader('user'), payload: { name: 'Private' } });
  const url = `${path}/${created.json().data.id}`;
  const update = await ctx.app.inject({ method: 'PATCH', url, headers: authHeader('other'), payload: { name: 'Stolen', ownerId: 'user-2' } });
  const remove = await ctx.app.inject({ method: 'DELETE', url, headers: authHeader('other') });
  expect(update.statusCode).toBe(404);
  expect(remove.statusCode).toBe(404);
  const original = await ctx.app.inject({ url, headers: authHeader('user') });
  expect(original.json().data.name).toBe('Private');
  expect(original.json().data).not.toHaveProperty('ownerId');
});

test('keeps liveness up, reports degraded readiness, and recovers when the DB double returns', async () => {
  const mongoUri = 'mongodb://test-double/recover';
  availability.set(mongoUri, false);
  const app = await buildApp({ mongoUri, auth: testAuthAdapter });
  try {
    expect((await app.inject('/health/live')).statusCode).toBe(200);
    expect((await app.inject('/health/ready')).statusCode).toBe(503);
    availability.set(mongoUri, true);
    expect((await app.inject('/health/ready')).statusCode).toBe(200);
    const created = await app.inject({ method: 'POST', url: ctx.url('/orders'), headers: authHeader('user'), payload: { name: 'Recovered' } });
    expect(created.statusCode).toBe(201);
  } finally { await app.close(); availability.delete(mongoUri); }
}, 60_000);

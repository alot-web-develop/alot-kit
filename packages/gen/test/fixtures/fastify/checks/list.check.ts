import { afterAll, beforeAll, expect, test } from 'vitest';
import { env } from '../src/config/env.js';
import { createTestApp, type TTestApp } from '../test/helpers/app.js';
import { authHeader } from '../test/helpers/auth.js';

let ctx: TTestApp;
beforeAll(async () => {
  env.CORS_ORIGINS = ['http://localhost:5173'];
  ctx = await createTestApp();
  for (const name of ['Alpha [draft]', 'AlphaXdraft', 'Beta']) {
    expect((await ctx.app.inject({ method: 'POST', url: ctx.url('/orders'), headers: authHeader('user'), payload: { name } })).statusCode).toBe(201);
  }
});
afterAll(async () => { await ctx.close(); });

test('returns the items and total consumed by every frontend list template', async () => {
  const response = await ctx.app.inject({ url: ctx.url('/orders?limit=2'), headers: authHeader('user') });
  expect(response.json().data).toMatchObject({ total: 3, page: 1, limit: 2, totalPages: 2 });
  expect(response.json().data.items).toHaveLength(2);
});

test('applies literal, case-insensitive search within the caller records', async () => {
  const response = await ctx.app.inject({ url: ctx.url('/orders?search=%5BDRAFT%5D'), headers: authHeader('user') });
  expect(response.json().data.items).toHaveLength(1);
  expect(response.json().data.items[0].name).toBe('Alpha [draft]');
  const other = await ctx.app.inject({ url: ctx.url('/orders?search=Alpha'), headers: authHeader('other') });
  expect(other.json().data.items).toEqual([]);
});

test('permits browser preflights for PATCH and DELETE from the configured frontend', async () => {
  for (const method of ['PATCH', 'DELETE']) {
    const response = await ctx.app.inject({ method: 'OPTIONS', url: ctx.url('/orders/000000000000000000000000'), headers: {
      origin: 'http://localhost:5173', 'access-control-request-method': method, 'access-control-request-headers': 'content-type,authorization',
    } });
    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-methods']).toContain(method);
  }
});

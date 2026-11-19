import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TTestApp } from '../helpers/app.js';
import { authHeader } from '../helpers/auth.js';

const MISSING_ID = '000000000000000000000000';

describe('orders routes', () => {
  let ctx: TTestApp;
  let path: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    path = ctx.url('/orders');
  });

  afterAll(async () => {
    await ctx.close();
  });

  const create = (name: string) =>
    ctx.app.inject({ method: 'POST', url: path, headers: authHeader('user'), payload: { name } });

  it('rejects requests without a session', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: path });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ success: false, error: { code: 'UNAUTHORIZED' } });
  });

  it('creates and reads a order', async () => {
    const created = await create('First');

    expect(created.statusCode).toBe(201);
    const { data } = created.json();
    expect(data).toMatchObject({ name: 'First' });

    const res = await ctx.app.inject({ method: 'GET', url: `${path}/${data.id}`, headers: authHeader('user') });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, data });
  });

  it('lists only the caller orders with pagination', async () => {
    await create('Second');

    const own = await ctx.app.inject({ method: 'GET', url: `${path}?limit=1`, headers: authHeader('user') });
    const other = await ctx.app.inject({ method: 'GET', url: path, headers: authHeader('other') });

    expect(own.statusCode).toBe(200);
    expect(own.json().data.items).toHaveLength(1);
    expect(own.json().data).toMatchObject({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(other.json().data).toMatchObject({ items: [], total: 0 });
  });

  it('rejects an invalid body', async () => {
    const res = await create('');

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });

  it('rejects an invalid id', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: `${path}/not-an-id`, headers: authHeader('user') });

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for a missing or foreign order', async () => {
    const { data } = (await create('Private')).json();

    const missing = await ctx.app.inject({ method: 'GET', url: `${path}/${MISSING_ID}`, headers: authHeader('user') });
    const foreign = await ctx.app.inject({ method: 'GET', url: `${path}/${data.id}`, headers: authHeader('other') });

    expect(missing.statusCode).toBe(404);
    expect(foreign.json()).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('updates and deletes a order', async () => {
    const { data } = (await create('Draft')).json();
    const url = `${path}/${data.id}`;

    const updated = await ctx.app.inject({ method: 'PATCH', url, headers: authHeader('user'), payload: { name: 'Final' } });
    const removed = await ctx.app.inject({ method: 'DELETE', url, headers: authHeader('user') });
    const after = await ctx.app.inject({ method: 'GET', url, headers: authHeader('user') });

    expect(updated.json().data).toMatchObject({ id: data.id, name: 'Final' });
    expect(removed.json()).toEqual({ success: true, data: { id: data.id } });
    expect(after.statusCode).toBe(404);
  });
});

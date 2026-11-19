import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TTestApp } from '../helpers/app.js';
import { authHeader } from '../helpers/auth.js';

describe('report route', () => {
  let ctx: TTestApp;
  let path: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    path = ctx.url('/report');
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('rejects requests without a session', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: path, payload: { name: 'value' } });

    expect(res.statusCode).toBe(401);
  });

  it('rejects users without the required role', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: path, headers: authHeader('user'), payload: { name: 'value' } });

    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ success: false, error: { code: 'FORBIDDEN' } });
  });

  it('rejects an invalid body', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: path, headers: authHeader('admin'), payload: {} });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });

  it('returns the result envelope', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: path, headers: authHeader('admin'), payload: { name: ' value ' } });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ success: true, data: { name: 'value' } });
  });
});

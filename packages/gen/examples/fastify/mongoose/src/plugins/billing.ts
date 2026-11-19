import fp from 'fastify-plugin';
import type { z } from 'zod';

type TBillingOptions = { baseUrl: string; apiKey: string; timeoutMs?: number };

type TBillingClient = {
  request: <T>(path: string, schema: z.ZodType<T>, init?: RequestInit) => Promise<T>;
};

declare module 'fastify' {
  interface FastifyInstance {
    billing: TBillingClient;
  }
}

const billingPlugin = fp<TBillingOptions>(
  async (app, { baseUrl, apiKey, timeoutMs = 10_000 }) => {
    const request = async <T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> => {
      const headers = new Headers(init?.headers);
      headers.set('authorization', `Bearer ${apiKey}`);
      headers.set('accept', 'application/json');

      const response = await fetch(new URL(path, baseUrl), {
        ...init,
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) throw new Error(`Billing request ${path} failed with ${response.status}`);
      return schema.parse(await response.json());
    };

    app.decorate('billing', { request });
  },
  { name: 'billing' },
);

export { billingPlugin };
export type { TBillingClient, TBillingOptions };

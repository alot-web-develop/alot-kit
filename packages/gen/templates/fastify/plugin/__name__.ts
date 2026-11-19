import fp from 'fastify-plugin';
import type { z } from 'zod';

type T__Name__Options = { baseUrl: string; apiKey: string; timeoutMs?: number };

type T__Name__Client = {
  request: <T>(path: string, schema: z.ZodType<T>, init?: RequestInit) => Promise<T>;
};

declare module 'fastify' {
  interface FastifyInstance {
    __name__: T__Name__Client;
  }
}

const __name__Plugin = fp<T__Name__Options>(
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
      if (!response.ok) throw new Error(`__Name__ request ${path} failed with ${response.status}`);
      return schema.parse(await response.json());
    };

    app.decorate('__name__', { request });
  },
  { name: '__name-kebab__' },
);

export { __name__Plugin };
export type { T__Name__Client, T__Name__Options };

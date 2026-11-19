import { errorSchema, ok, okSchema, requireRole } from '@alot-web-develop/server';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { __name__BodySchema, __name__ResultSchema } from '../schemas/__name__.js';
import { create__Name__Service } from '../services/__name__.js';

const __name__Routes: FastifyPluginAsyncZod = async (app) => {
  const service = create__Name__Service({ now: () => new Date() });

  app.post(
    '/',
    {
      preHandler: requireRole('admin'),
      schema: {
        tags: ['__name-kebab__'],
        body: __name__BodySchema,
        response: {
          200: okSchema(__name__ResultSchema),
          400: errorSchema,
          401: errorSchema,
          403: errorSchema,
        },
      },
    },
    async (request) => ok(await service.run(request.body)),
  );
};

export { __name__Routes };

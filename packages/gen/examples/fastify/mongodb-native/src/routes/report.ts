import { errorSchema, ok, okSchema, requireRole } from '@alot-web-develop/server';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { reportBodySchema, reportResultSchema } from '../schemas/report.js';
import { createReportService } from '../services/report.js';

const reportRoutes: FastifyPluginAsyncZod = async (app) => {
  const service = createReportService({ now: () => new Date() });

  app.post(
    '/',
    {
      preHandler: requireRole('admin'),
      schema: {
        tags: ['report'],
        body: reportBodySchema,
        response: {
          200: okSchema(reportResultSchema),
          400: errorSchema,
          401: errorSchema,
          403: errorSchema,
        },
      },
    },
    async (request) => ok(await service.run(request.body)),
  );
};

export { reportRoutes };

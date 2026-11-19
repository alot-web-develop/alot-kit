import { currentUser, errorSchema, notFound, ok, okSchema, paginatedSchema } from '@alot-web-develop/server';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  __name__ParamsSchema,
  __name__Schema,
  create__Name__Schema,
  list__Names__QuerySchema,
  update__Name__Schema,
} from '../schemas/__name__.js';
import { create__Name__Service } from '../services/__name__.js';

const NOT_FOUND = '__Name__ not found';
const TAGS = ['__names__'];
const errors = { 400: errorSchema, 401: errorSchema };

const __name__Routes: FastifyPluginAsyncZod = async (app) => {
  const service = create__Name__Service(app.db);

  app.get(
    '/',
    {
      schema: {
        tags: TAGS,
        querystring: list__Names__QuerySchema,
        response: { 200: okSchema(paginatedSchema(__name__Schema)), ...errors },
      },
    },
    async (request) => ok(await service.list(currentUser(request).id, request.query)),
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: TAGS,
        params: __name__ParamsSchema,
        response: { 200: okSchema(__name__Schema), ...errors, 404: errorSchema },
      },
    },
    async (request) => {
      const item = await service.get(currentUser(request).id, request.params.id);
      if (!item) throw notFound(NOT_FOUND);
      return ok(item);
    },
  );

  app.post(
    '/',
    {
      schema: {
        tags: TAGS,
        body: create__Name__Schema,
        response: { 201: okSchema(__name__Schema), ...errors },
      },
    },
    async (request, reply) => {
      reply.status(201);
      return ok(await service.create(currentUser(request).id, request.body));
    },
  );

  app.patch(
    '/:id',
    {
      schema: {
        tags: TAGS,
        params: __name__ParamsSchema,
        body: update__Name__Schema,
        response: { 200: okSchema(__name__Schema), ...errors, 404: errorSchema },
      },
    },
    async (request) => {
      const item = await service.update(currentUser(request).id, request.params.id, request.body);
      if (!item) throw notFound(NOT_FOUND);
      return ok(item);
    },
  );

  app.delete(
    '/:id',
    {
      schema: {
        tags: TAGS,
        params: __name__ParamsSchema,
        response: { 200: okSchema(z.object({ id: z.string() })), ...errors, 404: errorSchema },
      },
    },
    async (request) => {
      const removed = await service.remove(currentUser(request).id, request.params.id);
      if (!removed) throw notFound(NOT_FOUND);
      return ok({ id: request.params.id });
    },
  );
};

export { __name__Routes };

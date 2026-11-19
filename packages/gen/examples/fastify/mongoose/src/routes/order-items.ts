import { currentUser, errorSchema, notFound, ok, okSchema, paginatedSchema } from '@alot-web-develop/server';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  orderItemParamsSchema,
  orderItemSchema,
  createOrderItemSchema,
  listOrderItemsQuerySchema,
  updateOrderItemSchema,
} from '../schemas/orderItem.js';
import { createOrderItemService } from '../services/orderItem.js';

const NOT_FOUND = 'OrderItem not found';
const TAGS = ['orderItems'];
const errors = { 400: errorSchema, 401: errorSchema };

const orderItemRoutes: FastifyPluginAsyncZod = async (app) => {
  const service = createOrderItemService(app.db);

  app.get(
    '/',
    {
      schema: {
        tags: TAGS,
        querystring: listOrderItemsQuerySchema,
        response: { 200: okSchema(paginatedSchema(orderItemSchema)), ...errors },
      },
    },
    async (request) => ok(await service.list(currentUser(request).id, request.query)),
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: TAGS,
        params: orderItemParamsSchema,
        response: { 200: okSchema(orderItemSchema), ...errors, 404: errorSchema },
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
        body: createOrderItemSchema,
        response: { 201: okSchema(orderItemSchema), ...errors },
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
        params: orderItemParamsSchema,
        body: updateOrderItemSchema,
        response: { 200: okSchema(orderItemSchema), ...errors, 404: errorSchema },
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
        params: orderItemParamsSchema,
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

export { orderItemRoutes };

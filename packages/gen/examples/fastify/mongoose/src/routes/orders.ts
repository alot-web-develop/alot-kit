import { currentUser, errorSchema, notFound, ok, okSchema, paginatedSchema } from '@alot-web-develop/server';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  orderParamsSchema,
  orderSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderSchema,
} from '../schemas/order.js';
import { createOrderService } from '../services/order.js';

const NOT_FOUND = 'Order not found';
const TAGS = ['orders'];
const errors = { 400: errorSchema, 401: errorSchema };

const orderRoutes: FastifyPluginAsyncZod = async (app) => {
  const service = createOrderService(app.db);

  app.get(
    '/',
    {
      schema: {
        tags: TAGS,
        querystring: listOrdersQuerySchema,
        response: { 200: okSchema(paginatedSchema(orderSchema)), ...errors },
      },
    },
    async (request) => ok(await service.list(currentUser(request).id, request.query)),
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: TAGS,
        params: orderParamsSchema,
        response: { 200: okSchema(orderSchema), ...errors, 404: errorSchema },
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
        body: createOrderSchema,
        response: { 201: okSchema(orderSchema), ...errors },
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
        params: orderParamsSchema,
        body: updateOrderSchema,
        response: { 200: okSchema(orderSchema), ...errors, 404: errorSchema },
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
        params: orderParamsSchema,
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

export { orderRoutes };

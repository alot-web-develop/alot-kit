import { objectIdSchema, paginationQuerySchema } from '@alot-web-develop/server';
import { z } from 'zod';

const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const createOrderItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

const updateOrderItemSchema = createOrderItemSchema.partial();

const orderItemParamsSchema = z.object({ id: objectIdSchema });

const listOrderItemsQuerySchema = paginationQuerySchema.extend({ search: z.string().trim().max(200).optional() });

type TOrderItem = z.infer<typeof orderItemSchema>;
type TCreateOrderItem = z.infer<typeof createOrderItemSchema>;
type TUpdateOrderItem = z.infer<typeof updateOrderItemSchema>;
type TListOrderItemsQuery = z.infer<typeof listOrderItemsQuerySchema>;

export { orderItemParamsSchema, orderItemSchema, createOrderItemSchema, listOrderItemsQuerySchema, updateOrderItemSchema };
export type { TOrderItem, TCreateOrderItem, TListOrderItemsQuery, TUpdateOrderItem };

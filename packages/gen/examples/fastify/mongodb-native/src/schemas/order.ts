import { objectIdSchema, paginationQuerySchema } from '@alot-web-develop/server';
import { z } from 'zod';

const orderSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const createOrderSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

const updateOrderSchema = createOrderSchema.partial();

const orderParamsSchema = z.object({ id: objectIdSchema });

const listOrdersQuerySchema = paginationQuerySchema.extend({ search: z.string().trim().max(200).optional() });

type TOrder = z.infer<typeof orderSchema>;
type TCreateOrder = z.infer<typeof createOrderSchema>;
type TUpdateOrder = z.infer<typeof updateOrderSchema>;
type TListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export { orderParamsSchema, orderSchema, createOrderSchema, listOrdersQuerySchema, updateOrderSchema };
export type { TOrder, TCreateOrder, TListOrdersQuery, TUpdateOrder };

import { objectIdSchema, paginationQuerySchema } from '@alot-web-develop/server';
import { z } from 'zod';

const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(200),
});

const updateCustomerSchema = createCustomerSchema.partial();

const customerParamsSchema = z.object({ id: objectIdSchema });

const listCustomersQuerySchema = paginationQuerySchema.extend({ search: z.string().trim().max(200).optional() });

type TCustomer = z.infer<typeof customerSchema>;
type TCreateCustomer = z.infer<typeof createCustomerSchema>;
type TUpdateCustomer = z.infer<typeof updateCustomerSchema>;
type TListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

export { customerParamsSchema, customerSchema, createCustomerSchema, listCustomersQuerySchema, updateCustomerSchema };
export type { TCustomer, TCreateCustomer, TListCustomersQuery, TUpdateCustomer };

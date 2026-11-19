import { z } from 'zod';

const orderListSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

type TOrderListSearch = z.infer<typeof orderListSearchSchema>;

export { orderListSearchSchema };
export type { TOrderListSearch };

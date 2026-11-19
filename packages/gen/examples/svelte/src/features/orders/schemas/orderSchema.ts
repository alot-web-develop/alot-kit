import { z } from 'zod';

const orderSchema = z.object({
  name: z.string().trim().min(1),
});

type TOrderFormValues = z.infer<typeof orderSchema>;

export { orderSchema };
export type { TOrderFormValues };

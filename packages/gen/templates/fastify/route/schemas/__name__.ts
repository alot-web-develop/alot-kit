import { z } from 'zod';

const __name__BodySchema = z.object({
  name: z.string().trim().min(1).max(200),
});

const __name__ResultSchema = z.object({
  name: z.string(),
  processedAt: z.iso.datetime(),
});

type T__Name__Body = z.infer<typeof __name__BodySchema>;
type T__Name__Result = z.infer<typeof __name__ResultSchema>;

export { __name__BodySchema, __name__ResultSchema };
export type { T__Name__Body, T__Name__Result };

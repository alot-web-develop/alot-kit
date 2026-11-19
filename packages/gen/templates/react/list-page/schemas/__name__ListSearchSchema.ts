import { z } from 'zod';

const __name__ListSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

type T__Name__ListSearch = z.infer<typeof __name__ListSearchSchema>;

export type { T__Name__ListSearch };
export { __name__ListSearchSchema };

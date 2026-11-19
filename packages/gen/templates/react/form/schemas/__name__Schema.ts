import { z } from 'zod';

const __name__Schema = z.object({
  name: z.string().min(1),
});

type T__Name__FormValues = z.infer<typeof __name__Schema>;

export type { T__Name__FormValues };
export { __name__Schema };

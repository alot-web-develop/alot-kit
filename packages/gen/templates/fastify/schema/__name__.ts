import { objectIdSchema, paginationQuerySchema } from '@alot-web-develop/server';
import { z } from 'zod';

const __name__Schema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const create__Name__Schema = z.object({
  name: z.string().trim().min(1).max(200),
});

const update__Name__Schema = create__Name__Schema.partial();

const __name__ParamsSchema = z.object({ id: objectIdSchema });

const list__Names__QuerySchema = paginationQuerySchema.extend({ search: z.string().trim().max(200).optional() });

type T__Name__ = z.infer<typeof __name__Schema>;
type TCreate__Name__ = z.infer<typeof create__Name__Schema>;
type TUpdate__Name__ = z.infer<typeof update__Name__Schema>;
type TList__Names__Query = z.infer<typeof list__Names__QuerySchema>;

export { __name__ParamsSchema, __name__Schema, create__Name__Schema, list__Names__QuerySchema, update__Name__Schema };
export type { T__Name__, TCreate__Name__, TList__Names__Query, TUpdate__Name__ };

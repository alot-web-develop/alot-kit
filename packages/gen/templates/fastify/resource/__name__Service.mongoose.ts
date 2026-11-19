import { paginated, parsePagination } from '@alot-web-develop/server';
import type { Connection } from 'mongoose';
import { get__Name__Model, type T__Name__Doc } from '../models/__name__.js';
import type { T__Name__, TCreate__Name__, TList__Names__Query, TUpdate__Name__ } from '../schemas/__name__.js';

const to__Name__ = (doc: T__Name__Doc): T__Name__ => ({
  id: doc._id.toHexString(),
  name: doc.name,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const create__Name__Service = (db: Connection) => {
  const model = get__Name__Model(db);

  const list = async (ownerId: string, query: TList__Names__Query) => {
    const { skip, limit } = parsePagination(query);
    const name = query.search ? new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
    const filter = name ? { ownerId, name } : { ownerId };
    const [docs, total] = await Promise.all([
      model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<T__Name__Doc[]>(),
      model.countDocuments(filter),
    ]);
    return paginated(docs.map(to__Name__), total, query);
  };

  const get = async (ownerId: string, id: string) => {
    const doc = await model.findOne({ _id: id, ownerId }).lean<T__Name__Doc>();
    return doc ? to__Name__(doc) : null;
  };

  const create = async (ownerId: string, input: TCreate__Name__) => {
    const doc = await model.create({ ownerId, ...input });
    return to__Name__(doc.toObject());
  };

  const update = async (ownerId: string, id: string, input: TUpdate__Name__) => {
    const doc = await model
      .findOneAndUpdate({ _id: id, ownerId }, { $set: input }, { returnDocument: 'after', runValidators: true })
      .lean<T__Name__Doc>();
    return doc ? to__Name__(doc) : null;
  };

  const remove = async (ownerId: string, id: string) => {
    const { deletedCount } = await model.deleteOne({ _id: id, ownerId });
    return deletedCount === 1;
  };

  return { list, get, create, update, remove };
};

type T__Name__Service = ReturnType<typeof create__Name__Service>;

export { create__Name__Service };
export type { T__Name__Service };

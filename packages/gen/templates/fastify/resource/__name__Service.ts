import { paginated, parsePagination } from '@alot-web-develop/server';
import { type Db, type Filter, ObjectId } from 'mongodb';
import { get__Name__Collection, type T__Name__Doc } from '../models/__name__.js';
import type { T__Name__, TCreate__Name__, TList__Names__Query, TUpdate__Name__ } from '../schemas/__name__.js';

const to__Name__ = (doc: T__Name__Doc): T__Name__ => ({
  id: doc._id.toHexString(),
  name: doc.name,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const create__Name__Service = (db: Db) => {
  const collection = get__Name__Collection(db);
  const owned = (ownerId: string, id: string): Filter<T__Name__Doc> => ({ _id: new ObjectId(id), ownerId });

  const list = async (ownerId: string, query: TList__Names__Query) => {
    const { skip, limit } = parsePagination(query);
    const name = query.search ? new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
    const filter = name ? { ownerId, name } : { ownerId };
    const [docs, total] = await Promise.all([
      collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);
    return paginated(docs.map(to__Name__), total, query);
  };

  const get = async (ownerId: string, id: string) => {
    const doc = await collection.findOne(owned(ownerId, id));
    return doc ? to__Name__(doc) : null;
  };

  const create = async (ownerId: string, input: TCreate__Name__) => {
    const now = new Date();
    const doc: T__Name__Doc = { _id: new ObjectId(), ownerId, ...input, createdAt: now, updatedAt: now };
    await collection.insertOne(doc);
    return to__Name__(doc);
  };

  const update = async (ownerId: string, id: string, input: TUpdate__Name__) => {
    const doc = await collection.findOneAndUpdate(
      owned(ownerId, id),
      { $set: { ...input, updatedAt: new Date() } },
      { returnDocument: 'after' },
    );
    return doc ? to__Name__(doc) : null;
  };

  const remove = async (ownerId: string, id: string) => {
    const { deletedCount } = await collection.deleteOne(owned(ownerId, id));
    return deletedCount === 1;
  };

  return { list, get, create, update, remove };
};

type T__Name__Service = ReturnType<typeof create__Name__Service>;

export { create__Name__Service };
export type { T__Name__Service };

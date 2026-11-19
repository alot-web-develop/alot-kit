import { paginated, parsePagination } from '@alot-web-develop/server';
import { type Db, type Filter, ObjectId } from 'mongodb';
import { getOrderCollection, type TOrderDoc } from '../models/order.js';
import type { TOrder, TCreateOrder, TListOrdersQuery, TUpdateOrder } from '../schemas/order.js';

const toOrder = (doc: TOrderDoc): TOrder => ({
  id: doc._id.toHexString(),
  name: doc.name,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const createOrderService = (db: Db) => {
  const collection = getOrderCollection(db);
  const owned = (ownerId: string, id: string): Filter<TOrderDoc> => ({ _id: new ObjectId(id), ownerId });

  const list = async (ownerId: string, query: TListOrdersQuery) => {
    const { skip, limit } = parsePagination(query);
    const name = query.search ? new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
    const filter = name ? { ownerId, name } : { ownerId };
    const [docs, total] = await Promise.all([
      collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);
    return paginated(docs.map(toOrder), total, query);
  };

  const get = async (ownerId: string, id: string) => {
    const doc = await collection.findOne(owned(ownerId, id));
    return doc ? toOrder(doc) : null;
  };

  const create = async (ownerId: string, input: TCreateOrder) => {
    const now = new Date();
    const doc: TOrderDoc = { _id: new ObjectId(), ownerId, ...input, createdAt: now, updatedAt: now };
    await collection.insertOne(doc);
    return toOrder(doc);
  };

  const update = async (ownerId: string, id: string, input: TUpdateOrder) => {
    const doc = await collection.findOneAndUpdate(
      owned(ownerId, id),
      { $set: { ...input, updatedAt: new Date() } },
      { returnDocument: 'after' },
    );
    return doc ? toOrder(doc) : null;
  };

  const remove = async (ownerId: string, id: string) => {
    const { deletedCount } = await collection.deleteOne(owned(ownerId, id));
    return deletedCount === 1;
  };

  return { list, get, create, update, remove };
};

type TOrderService = ReturnType<typeof createOrderService>;

export { createOrderService };
export type { TOrderService };

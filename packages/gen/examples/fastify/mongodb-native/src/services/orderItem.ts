import { paginated, parsePagination } from '@alot-web-develop/server';
import { type Db, type Filter, ObjectId } from 'mongodb';
import { getOrderItemCollection, type TOrderItemDoc } from '../models/orderItem.js';
import type { TOrderItem, TCreateOrderItem, TListOrderItemsQuery, TUpdateOrderItem } from '../schemas/orderItem.js';

const toOrderItem = (doc: TOrderItemDoc): TOrderItem => ({
  id: doc._id.toHexString(),
  name: doc.name,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const createOrderItemService = (db: Db) => {
  const collection = getOrderItemCollection(db);
  const owned = (ownerId: string, id: string): Filter<TOrderItemDoc> => ({ _id: new ObjectId(id), ownerId });

  const list = async (ownerId: string, query: TListOrderItemsQuery) => {
    const { skip, limit } = parsePagination(query);
    const name = query.search ? new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
    const filter = name ? { ownerId, name } : { ownerId };
    const [docs, total] = await Promise.all([
      collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);
    return paginated(docs.map(toOrderItem), total, query);
  };

  const get = async (ownerId: string, id: string) => {
    const doc = await collection.findOne(owned(ownerId, id));
    return doc ? toOrderItem(doc) : null;
  };

  const create = async (ownerId: string, input: TCreateOrderItem) => {
    const now = new Date();
    const doc: TOrderItemDoc = { _id: new ObjectId(), ownerId, ...input, createdAt: now, updatedAt: now };
    await collection.insertOne(doc);
    return toOrderItem(doc);
  };

  const update = async (ownerId: string, id: string, input: TUpdateOrderItem) => {
    const doc = await collection.findOneAndUpdate(
      owned(ownerId, id),
      { $set: { ...input, updatedAt: new Date() } },
      { returnDocument: 'after' },
    );
    return doc ? toOrderItem(doc) : null;
  };

  const remove = async (ownerId: string, id: string) => {
    const { deletedCount } = await collection.deleteOne(owned(ownerId, id));
    return deletedCount === 1;
  };

  return { list, get, create, update, remove };
};

type TOrderItemService = ReturnType<typeof createOrderItemService>;

export { createOrderItemService };
export type { TOrderItemService };

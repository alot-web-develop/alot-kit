import { paginated, parsePagination } from '@alot-web-develop/server';
import type { Connection } from 'mongoose';
import { getOrderItemModel, type TOrderItemDoc } from '../models/orderItem.js';
import type { TOrderItem, TCreateOrderItem, TListOrderItemsQuery, TUpdateOrderItem } from '../schemas/orderItem.js';

const toOrderItem = (doc: TOrderItemDoc): TOrderItem => ({
  id: doc._id.toHexString(),
  name: doc.name,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const createOrderItemService = (db: Connection) => {
  const model = getOrderItemModel(db);

  const list = async (ownerId: string, query: TListOrderItemsQuery) => {
    const { skip, limit } = parsePagination(query);
    const name = query.search ? new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
    const filter = name ? { ownerId, name } : { ownerId };
    const [docs, total] = await Promise.all([
      model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<TOrderItemDoc[]>(),
      model.countDocuments(filter),
    ]);
    return paginated(docs.map(toOrderItem), total, query);
  };

  const get = async (ownerId: string, id: string) => {
    const doc = await model.findOne({ _id: id, ownerId }).lean<TOrderItemDoc>();
    return doc ? toOrderItem(doc) : null;
  };

  const create = async (ownerId: string, input: TCreateOrderItem) => {
    const doc = await model.create({ ownerId, ...input });
    return toOrderItem(doc.toObject());
  };

  const update = async (ownerId: string, id: string, input: TUpdateOrderItem) => {
    const doc = await model
      .findOneAndUpdate({ _id: id, ownerId }, { $set: input }, { returnDocument: 'after', runValidators: true })
      .lean<TOrderItemDoc>();
    return doc ? toOrderItem(doc) : null;
  };

  const remove = async (ownerId: string, id: string) => {
    const { deletedCount } = await model.deleteOne({ _id: id, ownerId });
    return deletedCount === 1;
  };

  return { list, get, create, update, remove };
};

type TOrderItemService = ReturnType<typeof createOrderItemService>;

export { createOrderItemService };
export type { TOrderItemService };

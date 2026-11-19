import { paginated, parsePagination } from '@alot-web-develop/server';
import type { Connection } from 'mongoose';
import { getOrderModel, type TOrderDoc } from '../models/order.js';
import type { TOrder, TCreateOrder, TListOrdersQuery, TUpdateOrder } from '../schemas/order.js';

const toOrder = (doc: TOrderDoc): TOrder => ({
  id: doc._id.toHexString(),
  name: doc.name,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const createOrderService = (db: Connection) => {
  const model = getOrderModel(db);

  const list = async (ownerId: string, query: TListOrdersQuery) => {
    const { skip, limit } = parsePagination(query);
    const name = query.search ? new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
    const filter = name ? { ownerId, name } : { ownerId };
    const [docs, total] = await Promise.all([
      model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<TOrderDoc[]>(),
      model.countDocuments(filter),
    ]);
    return paginated(docs.map(toOrder), total, query);
  };

  const get = async (ownerId: string, id: string) => {
    const doc = await model.findOne({ _id: id, ownerId }).lean<TOrderDoc>();
    return doc ? toOrder(doc) : null;
  };

  const create = async (ownerId: string, input: TCreateOrder) => {
    const doc = await model.create({ ownerId, ...input });
    return toOrder(doc.toObject());
  };

  const update = async (ownerId: string, id: string, input: TUpdateOrder) => {
    const doc = await model
      .findOneAndUpdate({ _id: id, ownerId }, { $set: input }, { returnDocument: 'after', runValidators: true })
      .lean<TOrderDoc>();
    return doc ? toOrder(doc) : null;
  };

  const remove = async (ownerId: string, id: string) => {
    const { deletedCount } = await model.deleteOne({ _id: id, ownerId });
    return deletedCount === 1;
  };

  return { list, get, create, update, remove };
};

type TOrderService = ReturnType<typeof createOrderService>;

export { createOrderService };
export type { TOrderService };

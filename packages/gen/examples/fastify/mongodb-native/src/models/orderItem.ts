import type { Collection, Db, ObjectId } from 'mongodb';

const ORDER_ITEM_COLLECTION = 'orderItems';

type TOrderItemDoc = {
  _id: ObjectId;
  ownerId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

const getOrderItemCollection = (db: Db): Collection<TOrderItemDoc> => db.collection<TOrderItemDoc>(ORDER_ITEM_COLLECTION);

const ensureOrderItemIndexes = (db: Db) =>
  getOrderItemCollection(db).createIndexes([{ key: { ownerId: 1, createdAt: -1 } }]);

export { ORDER_ITEM_COLLECTION, ensureOrderItemIndexes, getOrderItemCollection };
export type { TOrderItemDoc };

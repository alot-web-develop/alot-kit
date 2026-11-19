import type { Collection, Db, ObjectId } from 'mongodb';

const ORDER_COLLECTION = 'orders';

type TOrderDoc = {
  _id: ObjectId;
  ownerId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

const getOrderCollection = (db: Db): Collection<TOrderDoc> => db.collection<TOrderDoc>(ORDER_COLLECTION);

const ensureOrderIndexes = (db: Db) =>
  getOrderCollection(db).createIndexes([{ key: { ownerId: 1, createdAt: -1 } }]);

export { ORDER_COLLECTION, ensureOrderIndexes, getOrderCollection };
export type { TOrderDoc };

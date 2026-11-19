import type { Collection, Db, ObjectId } from 'mongodb';

const CUSTOMER_COLLECTION = 'customers';

type TCustomerDoc = {
  _id: ObjectId;
  ownerId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

const getCustomerCollection = (db: Db): Collection<TCustomerDoc> => db.collection<TCustomerDoc>(CUSTOMER_COLLECTION);

const ensureCustomerIndexes = (db: Db) =>
  getCustomerCollection(db).createIndexes([{ key: { ownerId: 1, createdAt: -1 } }]);

export { CUSTOMER_COLLECTION, ensureCustomerIndexes, getCustomerCollection };
export type { TCustomerDoc };

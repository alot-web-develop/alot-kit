import type { Collection, Db, ObjectId } from 'mongodb';

const __NAME___COLLECTION = '__names__';

type T__Name__Doc = {
  _id: ObjectId;
  ownerId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

const get__Name__Collection = (db: Db): Collection<T__Name__Doc> => db.collection<T__Name__Doc>(__NAME___COLLECTION);

const ensure__Name__Indexes = (db: Db) =>
  get__Name__Collection(db).createIndexes([{ key: { ownerId: 1, createdAt: -1 } }]);

export { __NAME___COLLECTION, ensure__Name__Indexes, get__Name__Collection };
export type { T__Name__Doc };

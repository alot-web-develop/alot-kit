import { ObjectId } from 'mongodb';

// Deliberately small driver doubles. They exercise generated services and routes,
// not MongoDB query semantics, transactions, indexes or connection recovery.
type TDoc = { _id: ObjectId; createdAt: Date; updatedAt: Date; [key: string]: unknown };
type TFilter = Record<string, unknown>;
export const availability = new Map<string, boolean>();

const matches = (doc: TDoc, filter: TFilter) => Object.entries(filter).every(([key, value]) => {
  if (value instanceof RegExp) return value.test(String(doc[key]));
  if (key === '_id') return String(doc[key]) === String(value);
  return doc[key] === value;
});

export const memoryDatabase = (isUp: () => boolean = () => true) => {
  const collections = new Map<string, ReturnType<typeof collection>>();
  const check = () => { if (!isUp()) throw new Error('Test database unavailable'); };
  const collection = () => {
    const docs: TDoc[] = [];
    return {
      createIndexes: async () => { check(); return []; },
      insertOne: async (doc: TDoc) => { check(); docs.push({ ...doc }); return { insertedId: doc._id }; },
      find: (filter: TFilter) => {
        let skip = 0;
        let limit = Number.MAX_SAFE_INTEGER;
        const query = {
          sort: (_sort: unknown) => query,
          skip: (value: number) => { skip = value; return query; },
          limit: (value: number) => { limit = value; return query; },
          toArray: async () => { check(); return docs.filter((doc) => matches(doc, filter)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(skip, skip + limit).map((doc) => ({ ...doc })); },
        };
        return query;
      },
      countDocuments: async (filter: TFilter) => { check(); return docs.filter((doc) => matches(doc, filter)).length; },
      findOne: async (filter: TFilter) => { check(); const doc = docs.find((doc) => matches(doc, filter)); return doc ? { ...doc } : null; },
      findOneAndUpdate: async (filter: TFilter, update: { $set: Partial<TDoc> }) => {
        check();
        const doc = docs.find((item) => matches(item, filter));
        if (!doc) return null;
        Object.assign(doc, update.$set);
        return { ...doc };
      },
      deleteOne: async (filter: TFilter) => {
        check();
        const index = docs.findIndex((doc) => matches(doc, filter));
        if (index < 0) return { deletedCount: 0 };
        docs.splice(index, 1);
        return { deletedCount: 1 };
      },
    };
  };
  return {
    command: async (_command: unknown) => { check(); return { ok: 1 }; },
    collection: (name: string) => {
      if (!collections.has(name)) collections.set(name, collection());
      return collections.get(name)!;
    },
  };
};

export const memoryConnection = () => {
  let uri = '';
  const db = memoryDatabase(() => availability.get(uri) !== false);
  const models: Record<string, ReturnType<typeof makeModel>> = {};
  const makeModel = (name: string) => {
    const collection = db.collection(name);
    const model = {
      find: (filter: TFilter) => {
        const query = collection.find(filter);
        const result = { sort: (sort: unknown) => { query.sort(sort); return result; }, skip: (skip: number) => { query.skip(skip); return result; }, limit: (limit: number) => { query.limit(limit); return result; }, lean: async () => query.toArray() };
        return result;
      },
      findOne: (filter: TFilter) => ({ lean: () => collection.findOne(filter) }),
      findOneAndUpdate: (filter: TFilter, update: { $set: Partial<TDoc> }, _options: unknown) => ({ lean: () => collection.findOneAndUpdate(filter, { $set: { ...update.$set, updatedAt: new Date() } }) }),
      create: async (input: Partial<TDoc>) => {
        const now = new Date();
        const doc: TDoc = { ...input, _id: new ObjectId(), createdAt: now, updatedAt: now };
        await collection.insertOne(doc);
        return { toObject: () => ({ ...doc }) };
      },
      countDocuments: collection.countDocuments,
      deleteOne: collection.deleteOne,
    };
    return model;
  };
  return {
    readyState: 0,
    db,
    models,
    model: (name: string, _schema?: unknown) => { models[name] ??= makeModel(name); return models[name]; },
    async openUri(value: string, _options: unknown) { uri = value; await db.command({ ping: 1 }); this.readyState = 1; },
    async close() { this.readyState = 0; },
  };
};

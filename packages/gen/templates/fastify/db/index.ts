import type { Db } from 'mongodb';

type TIndexBuilder = (db: Db) => Promise<unknown>;

const indexBuilders: TIndexBuilder[] = [];

const ensureIndexes = async (db: Db) => {
  await Promise.all(indexBuilders.map((build) => build(db)));
};

export { ensureIndexes };

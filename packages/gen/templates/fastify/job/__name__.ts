import { pathToFileURL } from 'node:url';
import { type Db, MongoClient, type ObjectId } from 'mongodb';
import { env } from '../config/env.js';

type T__Name__Doc = { _id: ObjectId; processedAt?: Date };
type T__Name__Deps = { db: Db; now: Date };
type T__Name__Result = { processed: number };

const run__Name__ = async ({ db, now }: T__Name__Deps): Promise<T__Name__Result> => {
  const { modifiedCount } = await db
    .collection<T__Name__Doc>('__names__')
    .updateMany({ processedAt: { $exists: false } }, { $set: { processedAt: now } });
  return { processed: modifiedCount };
};

const main = async () => {
  const client = await MongoClient.connect(env.MONGODB_URI);
  try {
    const result = await run__Name__({ db: client.db(), now: new Date() });
    process.stdout.write(`${JSON.stringify({ job: '__name-kebab__', ...result })}\n`);
  } finally {
    await client.close();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { run__Name__ };
export type { T__Name__Deps, T__Name__Result };

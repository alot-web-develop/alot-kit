import { pathToFileURL } from 'node:url';
import { type Db, MongoClient, type ObjectId } from 'mongodb';
import { env } from '../config/env.js';

type TReconcileDoc = { _id: ObjectId; processedAt?: Date };
type TReconcileDeps = { db: Db; now: Date };
type TReconcileResult = { processed: number };

const runReconcile = async ({ db, now }: TReconcileDeps): Promise<TReconcileResult> => {
  const { modifiedCount } = await db
    .collection<TReconcileDoc>('reconciles')
    .updateMany({ processedAt: { $exists: false } }, { $set: { processedAt: now } });
  return { processed: modifiedCount };
};

const main = async () => {
  const client = await MongoClient.connect(env.MONGODB_URI);
  try {
    const result = await runReconcile({ db: client.db(), now: new Date() });
    process.stdout.write(`${JSON.stringify({ job: 'reconcile', ...result })}\n`);
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

export { runReconcile };
export type { TReconcileDeps, TReconcileResult };

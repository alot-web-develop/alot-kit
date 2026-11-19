import fp from 'fastify-plugin';
import { type Db, MongoClient } from 'mongodb';
import { ensureIndexes } from '../models/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
    pingDb: () => Promise<void>;
  }
}

type TDbOptions = { uri: string };

const dbPlugin = fp<TDbOptions>(
  async (app, { uri }) => {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5_000 });
    const db = client.db();
    let indexed = false;

    const connect = async () => {
      await client.connect();
      if (!indexed) {
        await ensureIndexes(db);
        indexed = true;
      }
    };

    try {
      await connect();
    } catch (error) {
      app.log.warn({ err: error }, 'MongoDB unavailable, starting degraded');
    }

    app.decorate('db', db);
    app.decorate('pingDb', async () => {
      await connect();
      await db.command({ ping: 1 });
    });
    app.addHook('onClose', () => client.close());
  },
  { name: 'db' },
);

export { dbPlugin };

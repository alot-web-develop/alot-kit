import fp from 'fastify-plugin';
import mongoose, { type Connection } from 'mongoose';

declare module 'fastify' {
  interface FastifyInstance {
    db: Connection;
    pingDb: () => Promise<void>;
  }
}

type TDbOptions = { uri: string };

const DISCONNECTED = 0;

const dbPlugin = fp<TDbOptions>(
  async (app, { uri }) => {
    const connection = mongoose.createConnection();
    const options = { serverSelectionTimeoutMS: 5_000 };

    const connect = async () => {
      if (connection.readyState === DISCONNECTED) await connection.openUri(uri, options);
    };

    try {
      await connect();
    } catch (error) {
      app.log.warn({ err: error }, 'MongoDB unavailable, starting degraded');
    }

    app.decorate('db', connection);
    app.decorate('pingDb', async () => {
      await connect();
      if (!connection.db) throw new Error('MongoDB not connected');
      await connection.db.command({ ping: 1 });
    });
    app.addHook('onClose', () => connection.close());
  },
  { name: 'db' },
);

export { dbPlugin };

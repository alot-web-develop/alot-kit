import { MongoMemoryServer } from 'mongodb-memory-server';
import { buildApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { testAuthAdapter } from './auth.js';

const createTestApp = async () => {
  const mongo = await MongoMemoryServer.create();
  const app = await buildApp({ mongoUri: mongo.getUri(), auth: testAuthAdapter });
  await app.ready();

  const url = (path: string) => `${env.API_PREFIX}${path}`;
  const close = async () => {
    await app.close();
    await mongo.stop();
  };

  return { app, url, close };
};

type TTestApp = Awaited<ReturnType<typeof createTestApp>>;

export { createTestApp };
export type { TTestApp };

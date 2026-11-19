import { vi } from 'vitest';
import { availability, memoryConnection, memoryDatabase } from './database.js';

vi.mock('mongodb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongodb')>();
  return {
    ...actual,
    MongoClient: class {
      private database;
      constructor(private uri: string) {
        this.database = memoryDatabase(() => availability.get(this.uri) !== false);
      }
      db() { return this.database; }
      async connect() { await this.database.command({ ping: 1 }); return this; }
      async close() {}
    },
  };
});

vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>();
  return { ...actual, default: { ...actual.default, createConnection: memoryConnection } };
});

// Keep the real Better Auth HTTP/session/cookie/origin implementation. Replace
// only its persistence adapter, so neither DB variant opens a database socket.
vi.mock('better-auth/adapters/mongodb', async () => {
  const { memoryAdapter } = await import('better-auth/adapters/memory');
  return { mongodbAdapter: () => memoryAdapter({ user: [], session: [], account: [], verification: [] }) };
});

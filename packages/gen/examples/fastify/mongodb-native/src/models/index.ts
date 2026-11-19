import type { Db } from 'mongodb';
import { ensureOrderIndexes } from './order.js';
import { ensureCustomerIndexes } from './customer.js';
import { ensureOrderItemIndexes } from './orderItem.js';

type TIndexBuilder = (db: Db) => Promise<unknown>;

const indexBuilders: TIndexBuilder[] = [
  ensureOrderIndexes,
  ensureCustomerIndexes,
  ensureOrderItemIndexes,
];

const ensureIndexes = async (db: Db) => {
  await Promise.all(indexBuilders.map((build) => build(db)));
};

export { ensureIndexes };

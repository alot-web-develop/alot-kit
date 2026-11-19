import { expect, test } from 'vitest';
import { readOrderFilters } from '@/features/orders/utils/orderFilters';

test('reads bookmarked filters and rejects invalid URL values', () => {
  expect(readOrderFilters(new URLSearchParams('page=3&limit=10&search=%20Alice%20'))).toEqual({ page: 3, limit: 10, search: 'Alice' });
  expect(readOrderFilters(new URLSearchParams('page=-2&limit=1000'))).toEqual({ page: 1, limit: 100, search: '' });
  for (const page of ['0', '1.5', 'NaN', 'Infinity', '9007199254740992']) expect(readOrderFilters(new URLSearchParams({ page })).page).toBe(1);
});

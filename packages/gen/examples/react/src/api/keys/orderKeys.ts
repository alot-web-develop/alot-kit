import type { TOrderListQuery } from '@/types/main-api-types';

const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (query?: TOrderListQuery) => [...orderKeys.lists(), query ?? {}] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export { orderKeys };

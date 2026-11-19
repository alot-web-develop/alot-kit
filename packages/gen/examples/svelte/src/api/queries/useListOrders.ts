import { createQuery } from '@tanstack/svelte-query';
import { unwrap } from '@alot-web-develop/api';
import { orderKeys } from '@/api/keys/orderKeys';
import { listOrders } from '@/api/services/order';
import type { TOrderListQuery } from '@/types/main-api-types';

const useListOrders = (query: () => TOrderListQuery | undefined = () => undefined) => createQuery(() => ({
  queryKey: orderKeys.list(query()),
  queryFn: () => unwrap(listOrders(query())),
}));
export { useListOrders };

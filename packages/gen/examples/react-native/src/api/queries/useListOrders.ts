import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@alot-web-develop/api';
import { orderKeys } from '@/api/keys/orderKeys';
import { listOrders } from '@/api/services/order';
import type { TOrderListQuery } from '@/types/main-api-types';

const useListOrders = (query?: TOrderListQuery) => {
  return useQuery({
    queryKey: orderKeys.list(query),
    queryFn: () => unwrap(listOrders(query)),
  });
};

export { useListOrders };

import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@alot-web-develop/api';
import { orderKeys } from '@/api/keys/orderKeys';
import { getOrder } from '@/api/services/order';

const useGetOrder = (id: string) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => unwrap(getOrder(id)),
    enabled: Boolean(id),
  });
};

export { useGetOrder };

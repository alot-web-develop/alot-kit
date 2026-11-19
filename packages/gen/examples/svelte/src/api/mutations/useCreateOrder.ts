import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { unwrap } from '@alot-web-develop/api';
import { orderKeys } from '@/api/keys/orderKeys';
import { createOrder } from '@/api/services/order';
import type { TCreateOrderRequest } from '@/types/main-api-types';
const useCreateOrder = () => {
  const client = useQueryClient();
  return createMutation(() => ({
    mutationFn: (body: TCreateOrderRequest) => unwrap(createOrder(body)),
    onSuccess: () => client.invalidateQueries({ queryKey: orderKeys.lists() }),
  }));
};
export { useCreateOrder };

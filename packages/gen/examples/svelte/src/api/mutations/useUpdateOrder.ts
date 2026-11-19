import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { unwrap } from '@alot-web-develop/api';
import { orderKeys } from '@/api/keys/orderKeys';
import { updateOrder } from '@/api/services/order';
import type { TUpdateOrderRequest } from '@/types/main-api-types';
const useUpdateOrder = () => {
  const client = useQueryClient();
  return createMutation(() => ({
    mutationFn: ({ id, body }: { id: string; body: TUpdateOrderRequest }) => unwrap(updateOrder(id, body)),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: orderKeys.detail(id) }),
        client.invalidateQueries({ queryKey: orderKeys.lists() }),
      ]);
    },
  }));
};
export { useUpdateOrder };

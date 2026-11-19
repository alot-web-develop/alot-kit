import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { unwrap } from '@alot-web-develop/api';
import { orderKeys } from '@/api/keys/orderKeys';
import { deleteOrder } from '@/api/services/order';

const useDeleteOrder = () => {
  const client = useQueryClient();
  return createMutation(() => ({
    mutationFn: (id: string) => unwrap(deleteOrder(id)),
    onSuccess: () => client.invalidateQueries({ queryKey: orderKeys.all }),
  }));
};
export { useDeleteOrder };

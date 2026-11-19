import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@alot-web-develop/api';
import { orderKeys } from '@/api/keys/orderKeys';
import { updateOrder } from '@/api/services/order';
import type { TUpdateOrderRequest } from '@/types/main-api-types';

interface UpdateOrderArgs {
  id: string;
  body: TUpdateOrderRequest;
}

const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: UpdateOrderArgs) => unwrap(updateOrder(id, body)),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
};

export { useUpdateOrder };

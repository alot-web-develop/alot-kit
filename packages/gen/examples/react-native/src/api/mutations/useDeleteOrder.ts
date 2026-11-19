import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@alot-web-develop/api';
import { orderKeys } from '@/api/keys/orderKeys';
import { deleteOrder } from '@/api/services/order';

const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unwrap(deleteOrder(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
};

export { useDeleteOrder };

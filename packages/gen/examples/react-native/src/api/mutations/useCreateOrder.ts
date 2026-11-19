import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@alot-web-develop/api';
import { orderKeys } from '@/api/keys/orderKeys';
import { createOrder } from '@/api/services/order';
import type { TCreateOrderRequest } from '@/types/main-api-types';

const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: TCreateOrderRequest) => unwrap(createOrder(body)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),
  });
};

export { useCreateOrder };

import { unwrap } from '@alot-web-develop/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { __name__Keys } from '@/api/keys/__name__Keys';
import { create__Name__ } from '@/api/services/__name__';
import type { TCreate__Name__Request } from '@/types/main-api-types';

const useCreate__Name__ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: TCreate__Name__Request) => unwrap(create__Name__(body)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: __name__Keys.lists() }),
  });
};

export { useCreate__Name__ };

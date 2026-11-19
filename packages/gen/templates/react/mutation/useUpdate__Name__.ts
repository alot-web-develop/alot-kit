import { unwrap } from '@alot-web-develop/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { __name__Keys } from '@/api/keys/__name__Keys';
import { update__Name__ } from '@/api/services/__name__';
import type { TUpdate__Name__Request } from '@/types/main-api-types';

interface Update__Name__Args {
  id: string;
  body: TUpdate__Name__Request;
}

const useUpdate__Name__ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: Update__Name__Args) => unwrap(update__Name__(id, body)),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: __name__Keys.detail(id) });
      queryClient.invalidateQueries({ queryKey: __name__Keys.lists() });
    },
  });
};

export { useUpdate__Name__ };

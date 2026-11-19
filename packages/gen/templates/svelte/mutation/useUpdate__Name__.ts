import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { unwrap } from '@alot-web-develop/api';
import { __name__Keys } from '@/api/keys/__name__Keys';
import { update__Name__ } from '@/api/services/__name__';
import type { TUpdate__Name__Request } from '@/types/main-api-types';
const useUpdate__Name__ = () => {
  const client = useQueryClient();
  return createMutation(() => ({
    mutationFn: ({ id, body }: { id: string; body: TUpdate__Name__Request }) => unwrap(update__Name__(id, body)),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: __name__Keys.detail(id) }),
        client.invalidateQueries({ queryKey: __name__Keys.lists() }),
      ]);
    },
  }));
};
export { useUpdate__Name__ };

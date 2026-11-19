import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { unwrap } from '@alot-web-develop/api';
import { __name__Keys } from '@/api/keys/__name__Keys';
import { delete__Name__ } from '@/api/services/__name__';

const useDelete__Name__ = () => {
  const client = useQueryClient();
  return createMutation(() => ({
    mutationFn: (id: string) => unwrap(delete__Name__(id)),
    onSuccess: () => client.invalidateQueries({ queryKey: __name__Keys.all }),
  }));
};
export { useDelete__Name__ };

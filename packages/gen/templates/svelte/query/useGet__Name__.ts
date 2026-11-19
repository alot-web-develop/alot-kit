import { createQuery } from '@tanstack/svelte-query';
import { unwrap } from '@alot-web-develop/api';
import { __name__Keys } from '@/api/keys/__name__Keys';
import { get__Name__ } from '@/api/services/__name__';

const useGet__Name__ = (id: () => string) => createQuery(() => ({
  queryKey: __name__Keys.detail(id()),
  queryFn: () => unwrap(get__Name__(id())),
  enabled: Boolean(id()),
}));
export { useGet__Name__ };

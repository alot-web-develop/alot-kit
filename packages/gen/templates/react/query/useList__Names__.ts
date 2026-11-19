import { unwrap } from '@alot-web-develop/api';
import { useQuery } from '@tanstack/react-query';
import { __name__Keys } from '@/api/keys/__name__Keys';
import { list__Names__ } from '@/api/services/__name__';
import type { T__Name__ListQuery } from '@/types/main-api-types';

const useList__Names__ = (query?: T__Name__ListQuery) => {
  return useQuery({
    queryKey: __name__Keys.list(query),
    queryFn: () => unwrap(list__Names__(query)),
  });
};

export { useList__Names__ };

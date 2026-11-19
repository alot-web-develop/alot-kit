import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@alot-web-develop/api';
import { __name__Keys } from '@/api/keys/__name__Keys';
import { delete__Name__ } from '@/api/services/__name__';

const useDelete__Name__ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unwrap(delete__Name__(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: __name__Keys.all }),
  });
};

export { useDelete__Name__ };

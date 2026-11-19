import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';
import { __Name__ListPage } from '@/features/__feature__/pages/__Name__ListPage';
import {
  __name__ListSearchSchema,
  type T__Name__ListSearch,
} from '@/features/__feature__/schemas/__name__ListSearchSchema';

const __Name__ListRoute = () => {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const onSearchChange = useCallback(
    (next: Partial<T__Name__ListSearch>) => navigate({ search: (prev) => ({ ...prev, ...next }) }),
    [navigate],
  );

  return <__Name__ListPage search={search} onSearchChange={onSearchChange} />;
};

const Route = createFileRoute('/_app/__names-kebab__/')({
  validateSearch: __name__ListSearchSchema,
  component: __Name__ListRoute,
});

export { Route };

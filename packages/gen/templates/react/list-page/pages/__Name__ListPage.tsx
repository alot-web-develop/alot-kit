import { useList__Names__ } from '@/api/queries/useList__Names__';
import { ListPagination } from '@/components/ListPagination';
import { PageShell } from '@/components/PageShell';
import { QueryBoundary } from '@/components/QueryBoundary';
import { __Name__ListFilters } from '../components/__Name__ListFilters';
import { __Name__Table } from '../components/__Name__Table';
import type { T__Name__ListSearch } from '../schemas/__name__ListSearchSchema';

interface __Name__ListPageProps {
  search: T__Name__ListSearch;
  onSearchChange: (search: Partial<T__Name__ListSearch>) => void;
}

const __Name__ListPage = ({ search, onSearchChange }: __Name__ListPageProps) => {
  const query = useList__Names__(search);

  return (
    <PageShell className="flex flex-col gap-4">
      <__Name__ListFilters search={search.search} onSearchChange={(value) => onSearchChange({ search: value, page: 1 })} />
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0}>
        {(data) => (
          <>
            <__Name__Table __names__={data.items} />
            <ListPagination
              page={search.page}
              pageSize={search.limit}
              total={data.total}
              onPageChange={(page) => onSearchChange({ page })}
            />
          </>
        )}
      </QueryBoundary>
    </PageShell>
  );
};

export { __Name__ListPage };

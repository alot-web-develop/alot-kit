import { useListOrders } from '@/api/queries/useListOrders';
import { ListPagination } from '@/components/ListPagination';
import { PageShell } from '@/components/PageShell';
import { QueryBoundary } from '@/components/QueryBoundary';
import { OrderListFilters } from '../components/OrderListFilters';
import { OrderTable } from '../components/OrderTable';
import type { TOrderListSearch } from '../schemas/orderListSearchSchema';

interface OrderListPageProps {
  search: TOrderListSearch;
  onSearchChange: (search: Partial<TOrderListSearch>) => void;
}

const OrderListPage = ({ search, onSearchChange }: OrderListPageProps) => {
  const query = useListOrders(search);

  return (
    <PageShell className="flex flex-col gap-4">
      <OrderListFilters search={search.search} onSearchChange={(value) => onSearchChange({ search: value, page: 1 })} />
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0}>
        {(data) => (
          <>
            <OrderTable orders={data.items} />
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

export { OrderListPage };

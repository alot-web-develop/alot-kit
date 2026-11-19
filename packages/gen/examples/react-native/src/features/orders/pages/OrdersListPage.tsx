import { PageShell } from '@alot-web-develop/ui-native/page-shell';
import { QueryBoundary } from '@alot-web-develop/ui-native/query-boundary';
import { SearchInput } from '@alot-web-develop/ui-native/search-input';
import { useTranslation } from 'react-i18next';
import { useListOrders } from '@/api/queries/useListOrders';
import { OrdersList } from '../components/OrdersList';

const PAGE_SIZE = 20;

interface OrdersListPageProps {
  search: string;
  page: number;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onSelect: (id: string) => void;
}

const OrdersListPage = ({ search, page, onSearchChange, onPageChange, onSelect }: OrdersListPageProps) => {
  const { t } = useTranslation();
  const query = useListOrders({ page, limit: PAGE_SIZE, search });

  return (
    <PageShell>
      <SearchInput value={search} onSearch={onSearchChange} placeholder={t('orders.list.search')} />
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0}>
        {(data) => (
          <OrdersList
            items={data.items}
            page={page}
            pageCount={Math.max(1, Math.ceil(data.total / PAGE_SIZE))}
            onPageChange={onPageChange}
            onSelect={onSelect}
          />
        )}
      </QueryBoundary>
    </PageShell>
  );
};

export { OrdersListPage };

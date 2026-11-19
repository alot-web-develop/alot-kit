import { useLocalSearchParams, useRouter } from 'expo-router';
import { OrdersListPage } from '@/features/orders/pages/OrdersListPage';

const OrdersListRoute = () => {
  const router = useRouter();
  const { search, page } = useLocalSearchParams<{ search?: string; page?: string }>();

  return (
    <OrdersListPage
      search={search ?? ''}
      page={Number(page ?? 1)}
      onSearchChange={(next) => router.setParams({ search: next, page: '1' })}
      onPageChange={(nextPage) => router.setParams({ page: String(nextPage) })}
      onSelect={(id) => router.push(`/orders/${id}`)}
    />
  );
};

export default OrdersListRoute;

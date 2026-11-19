import { useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { OrderListPage } from '@/features/orders/pages/OrderListPage';
import {
  orderListSearchSchema,
  type TOrderListSearch,
} from '@/features/orders/schemas/orderListSearchSchema';

const OrderListRoute = () => {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const onSearchChange = useCallback(
    (next: Partial<TOrderListSearch>) => navigate({ search: (prev) => ({ ...prev, ...next }) }),
    [navigate],
  );

  return <OrderListPage search={search} onSearchChange={onSearchChange} />;
};

const Route = createFileRoute('/_app/orders/')({
  validateSearch: orderListSearchSchema,
  component: OrderListRoute,
});

export { Route };

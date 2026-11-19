import { PageShell } from '@alot-web-develop/ui-native/page-shell';
import { QueryBoundary } from '@alot-web-develop/ui-native/query-boundary';
import { useGetOrder } from '@/api/queries/useGetOrder';
import { OrderContent } from '../components/OrderContent';
import { OrderHeader } from '../components/OrderHeader';

interface OrderPageProps {
  id: string;
}

const OrderPage = ({ id }: OrderPageProps) => {
  const query = useGetOrder(id);

  return (
    <PageShell scroll>
      <QueryBoundary query={query}>
        {(order) => (
          <>
            <OrderHeader order={order} />
            <OrderContent order={order} />
          </>
        )}
      </QueryBoundary>
    </PageShell>
  );
};

export { OrderPage };

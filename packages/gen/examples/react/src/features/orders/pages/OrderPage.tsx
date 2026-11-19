import { PageShell } from '@/components/PageShell';
import { QueryBoundary } from '@/components/QueryBoundary';
import { useGetOrder } from '@/api/queries/useGetOrder';
import { OrderContent } from '../components/OrderContent';
import { OrderHeader } from '../components/OrderHeader';

interface OrderPageProps {
  id: string;
}

const OrderPage = ({ id }: OrderPageProps) => {
  const query = useGetOrder(id);

  return (
    <PageShell>
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

import { createFileRoute } from '@tanstack/react-router';
import { OrderPage } from '@/features/orders/pages/OrderPage';

const OrderRoute = () => {
  const { orderId } = Route.useParams();

  return <OrderPage id={orderId} />;
};

const Route = createFileRoute('/_app/orders/$orderId')({ component: OrderRoute });

export { Route };

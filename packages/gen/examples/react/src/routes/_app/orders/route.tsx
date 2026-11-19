import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { OrdersLayout } from '@/features/orders/components/OrdersLayout';

const OrdersLayoutRoute = () => {
  const { t } = useTranslation();

  return (
    <OrdersLayout title={t('orders.title')}>
      <Outlet />
    </OrdersLayout>
  );
};

const Route = createFileRoute('/_app/orders')({ component: OrdersLayoutRoute });

export { Route };

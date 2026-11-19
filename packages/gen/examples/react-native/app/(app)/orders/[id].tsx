import { useLocalSearchParams } from 'expo-router';
import { OrderPage } from '@/features/orders/pages/OrderPage';

const OrderRoute = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <OrderPage id={id} />;
};

export default OrderRoute;

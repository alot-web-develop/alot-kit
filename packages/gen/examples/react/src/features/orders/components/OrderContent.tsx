import { Card, CardContent } from '@alot-web-develop/ui/card';
import type { TOrder } from '@/types/main-api-types';

interface OrderContentProps {
  order: TOrder;
}

const OrderContent = ({ order }: OrderContentProps) => {
  return (
    <Card>
      <CardContent>{order.name}</CardContent>
    </Card>
  );
};

export { OrderContent };

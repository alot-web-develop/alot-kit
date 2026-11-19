import type { TOrder } from '@/types/main-api-types';

interface OrderHeaderProps {
  order: TOrder;
}

const OrderHeader = ({ order }: OrderHeaderProps) => {
  return (
    <header>
      <h1 className="text-xl font-semibold text-foreground">{order.name}</h1>
    </header>
  );
};

export { OrderHeader };

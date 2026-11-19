import { Box } from '@alot-web-develop/ui-native/box';
import { Text } from '@alot-web-develop/ui-native/text';
import type { TOrder } from '@/types/main-api-types';

interface OrderHeaderProps {
  order: TOrder;
}

const OrderHeader = ({ order }: OrderHeaderProps) => {
  return (
    <Box.Header>
      <Text variant="title">{order.name}</Text>
    </Box.Header>
  );
};

export { OrderHeader };

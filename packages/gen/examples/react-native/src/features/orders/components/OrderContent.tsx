import { Box } from '@alot-web-develop/ui-native/box';
import { Text } from '@alot-web-develop/ui-native/text';
import type { TOrder } from '@/types/main-api-types';

interface OrderContentProps {
  order: TOrder;
}

const OrderContent = ({ order }: OrderContentProps) => {
  return (
    <Box.Body>
      <Text>{order.name}</Text>
    </Box.Body>
  );
};

export { OrderContent };

import { Box } from '@alot-web-develop/ui-native/box';
import { cn } from '@alot-web-develop/ui-native/lib';
import { Text } from '@alot-web-develop/ui-native/text';
import type { ViewProps } from '@alot-web-develop/ui-native/types';
import { formatDate } from '@alot-web-develop/utils/format';
import type { TOrder } from '@/types/main-api-types';

interface OrderSummaryProps extends ViewProps {
  order: TOrder;
}

const OrderSummary = ({ order, className, ...rest }: OrderSummaryProps) => {
  return (
    <Box className={cn('flex-col gap-2', className)} {...rest}>
      <Box.Header>
        <Text variant="heading">{order.name}</Text>
      </Box.Header>
      <Box.Body>
        <Text variant="muted">{formatDate(order.createdAt)}</Text>
      </Box.Body>
    </Box>
  );
};

export { OrderSummary };

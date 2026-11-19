import { Box } from '@alot-web-develop/ui-native/box';
import { Text } from '@alot-web-develop/ui-native/text';
import { formatDate } from '@alot-web-develop/utils/format';
import { memo } from 'react';
import { Pressable } from 'react-native';
import type { TOrder } from '@/types/main-api-types';

interface OrderListItemProps {
  order: TOrder;
  onSelect: (id: string) => void;
}

const OrderListItem = memo(({ order, onSelect }: OrderListItemProps) => {
  return (
    <Pressable onPress={() => onSelect(order.id)}>
      <Box className="flex-col gap-1">
        <Text variant="heading">{order.name}</Text>
        <Text variant="muted">{formatDate(order.createdAt)}</Text>
      </Box>
    </Pressable>
  );
});

export { OrderListItem };

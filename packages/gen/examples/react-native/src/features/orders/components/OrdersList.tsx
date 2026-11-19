import { Box } from '@alot-web-develop/ui-native/box';
import { Button } from '@alot-web-develop/ui-native/button';
import { Text } from '@alot-web-develop/ui-native/text';
import { FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TOrder } from '@/types/main-api-types';
import { OrderListItem } from './OrderListItem';

interface OrdersListProps {
  items: TOrder[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onSelect: (id: string) => void;
}

const OrdersList = ({ items, page, pageCount, onPageChange, onSelect }: OrdersListProps) => {
  const { t } = useTranslation();

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <OrderListItem order={item} onSelect={onSelect} />}
      ItemSeparatorComponent={() => <Box className="h-2" />}
      ListFooterComponent={
        <Box.Footer className="items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onPress={() => onPageChange(page - 1)}>
            {t('common.previous')}
          </Button>
          <Text variant="muted">{`${page} / ${pageCount}`}</Text>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onPress={() => onPageChange(page + 1)}>
            {t('common.next')}
          </Button>
        </Box.Footer>
      }
    />
  );
};

export { OrdersList };

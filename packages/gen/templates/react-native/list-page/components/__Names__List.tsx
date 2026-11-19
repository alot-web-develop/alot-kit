import { Box } from '@alot-web-develop/ui-native/box';
import { Button } from '@alot-web-develop/ui-native/button';
import { Text } from '@alot-web-develop/ui-native/text';
import { FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { T__Name__ } from '@/types/main-api-types';
import { __Name__ListItem } from './__Name__ListItem';

interface __Names__ListProps {
  items: T__Name__[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onSelect: (id: string) => void;
}

const __Names__List = ({ items, page, pageCount, onPageChange, onSelect }: __Names__ListProps) => {
  const { t } = useTranslation();

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <__Name__ListItem __name__={item} onSelect={onSelect} />}
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

export { __Names__List };

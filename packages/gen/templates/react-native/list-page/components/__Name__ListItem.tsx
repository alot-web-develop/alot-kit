import { Box } from '@alot-web-develop/ui-native/box';
import { Text } from '@alot-web-develop/ui-native/text';
import { formatDate } from '@alot-web-develop/utils/format';
import { memo } from 'react';
import { Pressable } from 'react-native';
import type { T__Name__ } from '@/types/main-api-types';

interface __Name__ListItemProps {
  __name__: T__Name__;
  onSelect: (id: string) => void;
}

const __Name__ListItem = memo(({ __name__, onSelect }: __Name__ListItemProps) => {
  return (
    <Pressable onPress={() => onSelect(__name__.id)}>
      <Box className="flex-col gap-1">
        <Text variant="heading">{__name__.name}</Text>
        <Text variant="muted">{formatDate(__name__.createdAt)}</Text>
      </Box>
    </Pressable>
  );
});

export { __Name__ListItem };

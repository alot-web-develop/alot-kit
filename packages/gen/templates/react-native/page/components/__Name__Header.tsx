import { Box } from '@alot-web-develop/ui-native/box';
import { Text } from '@alot-web-develop/ui-native/text';
import type { T__Name__ } from '@/types/main-api-types';

interface __Name__HeaderProps {
  __name__: T__Name__;
}

const __Name__Header = ({ __name__ }: __Name__HeaderProps) => {
  return (
    <Box.Header>
      <Text variant="title">{__name__.name}</Text>
    </Box.Header>
  );
};

export { __Name__Header };

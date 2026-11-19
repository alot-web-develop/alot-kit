import { Box } from '@alot-web-develop/ui-native/box';
import { Text } from '@alot-web-develop/ui-native/text';
import type { T__Name__ } from '@/types/main-api-types';

interface __Name__ContentProps {
  __name__: T__Name__;
}

const __Name__Content = ({ __name__ }: __Name__ContentProps) => {
  return (
    <Box.Body>
      <Text>{__name__.name}</Text>
    </Box.Body>
  );
};

export { __Name__Content };

import { Box } from '@alot-web-develop/ui-native/box';
import { cn } from '@alot-web-develop/ui-native/lib';
import { Text } from '@alot-web-develop/ui-native/text';
import type { ViewProps } from '@alot-web-develop/ui-native/types';
import { formatDate } from '@alot-web-develop/utils/format';
import type { T__Entity__ } from '@/types/main-api-types';

interface __Name__Props extends ViewProps {
  __entity__: T__Entity__;
}

const __Name__ = ({ __entity__, className, ...rest }: __Name__Props) => {
  return (
    <Box className={cn('flex-col gap-2', className)} {...rest}>
      <Box.Header>
        <Text variant="heading">{__entity__.name}</Text>
      </Box.Header>
      <Box.Body>
        <Text variant="muted">{formatDate(__entity__.createdAt)}</Text>
      </Box.Body>
    </Box>
  );
};

export { __Name__ };

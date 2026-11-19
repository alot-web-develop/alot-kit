import { Box } from '@alot-web-develop/ui-native/box';
import { cn } from '@alot-web-develop/ui-native/lib';
import type { ViewProps } from '@alot-web-develop/ui-native/types';

const __Name__ = ({ children, className, ...rest }: ViewProps) => {
  return (
    <Box className={cn('flex-col', className)} {...rest}>
      {children}
    </Box>
  );
};

const Header = ({ children, className, ...rest }: ViewProps) => {
  return (
    <Box.Header className={cn('flex-row items-center justify-between', className)} {...rest}>
      {children}
    </Box.Header>
  );
};

const Body = ({ children, className, ...rest }: ViewProps) => {
  return (
    <Box.Body className={cn('flex-col gap-4', className)} {...rest}>
      {children}
    </Box.Body>
  );
};

const Footer = ({ children, className, ...rest }: ViewProps) => {
  return (
    <Box.Footer className={cn('flex-row justify-end gap-2', className)} {...rest}>
      {children}
    </Box.Footer>
  );
};

__Name__.Header = Header;
__Name__.Body = Body;
__Name__.Footer = Footer;

export { __Name__ };

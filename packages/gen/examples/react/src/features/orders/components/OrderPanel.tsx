import type { ComponentProps } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@alot-web-develop/ui/card';
import { cn } from '@alot-web-develop/ui/lib';

const OrderPanel = ({ children, className, ...rest }: ComponentProps<'div'>) => {
  return (
    <Card className={cn('gap-4', className)} {...rest}>
      {children}
    </Card>
  );
};

const Header = ({ children, className, ...rest }: ComponentProps<'div'>) => {
  return (
    <CardHeader className={cn('flex items-center justify-between', className)} {...rest}>
      {children}
    </CardHeader>
  );
};

const Body = ({ children, className, ...rest }: ComponentProps<'div'>) => {
  return (
    <CardContent className={cn('flex flex-col gap-4', className)} {...rest}>
      {children}
    </CardContent>
  );
};

const Footer = ({ children, className, ...rest }: ComponentProps<'div'>) => {
  return (
    <CardFooter className={cn('flex justify-end gap-2', className)} {...rest}>
      {children}
    </CardFooter>
  );
};

OrderPanel.Header = Header;
OrderPanel.Body = Body;
OrderPanel.Footer = Footer;

export { OrderPanel };

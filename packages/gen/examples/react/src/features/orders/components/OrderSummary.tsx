import type { ComponentProps } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@alot-web-develop/ui/card';
import { cn } from '@alot-web-develop/ui/lib';
import { formatDate } from '@alot-web-develop/utils/format';
import type { TOrder } from '@/types/main-api-types';

interface OrderSummaryProps extends ComponentProps<'div'> {
  order: TOrder;
}

const OrderSummary = ({ order, className, ...rest }: OrderSummaryProps) => {
  return (
    <Card className={cn('gap-2', className)} {...rest}>
      <CardHeader>
        <CardTitle>{order.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>
      </CardContent>
    </Card>
  );
};

export { OrderSummary };

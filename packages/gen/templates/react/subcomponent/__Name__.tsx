import { Card, CardContent, CardHeader, CardTitle } from '@alot-web-develop/ui/card';
import { cn } from '@alot-web-develop/ui/lib';
import { formatDate } from '@alot-web-develop/utils/format';
import type { ComponentProps } from 'react';
import type { T__Entity__ } from '@/types/main-api-types';

interface __Name__Props extends ComponentProps<'div'> {
  __entity__: T__Entity__;
}

const __Name__ = ({ __entity__, className, ...rest }: __Name__Props) => {
  return (
    <Card className={cn('gap-2', className)} {...rest}>
      <CardHeader>
        <CardTitle>{__entity__.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-sm text-muted-foreground">{formatDate(__entity__.createdAt)}</span>
      </CardContent>
    </Card>
  );
};

export { __Name__ };

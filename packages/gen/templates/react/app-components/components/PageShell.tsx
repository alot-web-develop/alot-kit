import { cn } from '@alot-web-develop/ui/lib';
import type { ComponentProps } from 'react';

const PageShell = ({ className, ...rest }: ComponentProps<'div'>) => {
  return <div className={cn('mx-auto flex w-full max-w-6xl flex-col gap-6', className)} {...rest} />;
};

export { PageShell };

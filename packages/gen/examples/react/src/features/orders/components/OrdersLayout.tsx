import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@alot-web-develop/ui/lib';

interface OrdersLayoutProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: ReactNode;
  actions?: ReactNode;
}

const OrdersLayout = ({ title, actions, children, className, ...rest }: OrdersLayoutProps) => {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...rest}>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
};

export { OrdersLayout };

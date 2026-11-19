import { cn } from '@alot-web-develop/ui/lib';
import type { ComponentProps } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

const AppLayout = ({ children, className, ...rest }: ComponentProps<'div'>) => {
  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar />
      <div className={cn('flex min-w-0 flex-1 flex-col', className)} {...rest}>
        <AppHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export { AppLayout };

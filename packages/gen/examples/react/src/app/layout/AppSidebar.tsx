import type { ComponentProps } from 'react';
import { cn } from '@alot-web-develop/ui/lib';
import { useTranslation } from 'react-i18next';
import { AppNav } from './AppNav';

const AppSidebar = ({ className, ...rest }: ComponentProps<'aside'>) => {
  const { t } = useTranslation();

  return (
    <aside
      className={cn('hidden w-60 shrink-0 flex-col border-r border-border bg-surface-1 md:flex', className)}
      {...rest}
    >
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-semibold text-foreground">{t('common.appName')}</span>
      </div>
      <AppNav />
    </aside>
  );
};

export { AppSidebar };

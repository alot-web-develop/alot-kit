import { Button } from '@alot-web-develop/ui/button';
import { cn } from '@alot-web-develop/ui/lib';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { signOut, useSession } from '@/lib/auth';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from './ThemeToggle';

const AppHeader = ({ className, ...rest }: ComponentProps<'header'>) => {
  const { t } = useTranslation();
  const { user } = useSession();

  return (
    <header
      className={cn('flex h-14 items-center gap-2 border-b border-border bg-background px-4', className)}
      {...rest}
    >
      <MobileNav />
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">{user?.name}</span>
        <ThemeToggle />
        <Button variant="secondary" size="sm" onClick={() => void signOut()}>
          {t('common.signOut')}
        </Button>
      </div>
    </header>
  );
};

export { AppHeader };

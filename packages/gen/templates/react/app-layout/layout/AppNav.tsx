import { Button } from '@alot-web-develop/ui/button';
import { cn } from '@alot-web-develop/ui/lib';
import { Link, useMatchRoute } from '@tanstack/react-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS, type NavItem } from './navItems';

interface AppNavItemProps {
  item: NavItem;
}

const AppNavItem = ({ item }: AppNavItemProps) => {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();
  const isActive = Boolean(matchRoute({ to: item.to, fuzzy: !item.exact }));

  return (
    <li>
      <Button asChild variant={isActive ? 'secondary' : 'ghost'} className="w-full justify-start">
        <Link to={item.to} aria-current={isActive ? 'page' : undefined}>
          {t(item.labelKey)}
        </Link>
      </Button>
    </li>
  );
};

const AppNav = ({ className, ...rest }: ComponentProps<'nav'>) => {
  return (
    <nav className={cn('flex flex-col gap-1 p-2', className)} {...rest}>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <AppNavItem key={item.labelKey} item={item} />
        ))}
      </ul>
    </nav>
  );
};

export { AppNav };

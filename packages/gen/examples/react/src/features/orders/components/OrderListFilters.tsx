import type { ComponentProps } from 'react';
import { Input } from '@alot-web-develop/ui/input';
import { cn } from '@alot-web-develop/ui/lib';
import { useTranslation } from 'react-i18next';
import { useOrderSearchInput } from '../hooks/useOrderSearchInput';

interface OrderListFiltersProps extends ComponentProps<'div'> {
  search?: string;
  onSearchChange: (search: string) => void;
}

const OrderListFilters = ({ search = '', onSearchChange, className, ...rest }: OrderListFiltersProps) => {
  const { t } = useTranslation();
  const searchInput = useOrderSearchInput(search, onSearchChange);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} {...rest}>
      <Input
        type="search"
        aria-label={t('orders.list.search')}
        placeholder={t('orders.list.search')}
        value={searchInput.value}
        onChange={searchInput.onChange}
        className="max-w-xs"
      />
    </div>
  );
};

export { OrderListFilters };

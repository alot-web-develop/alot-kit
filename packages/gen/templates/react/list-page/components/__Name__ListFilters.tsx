import { Input } from '@alot-web-develop/ui/input';
import { cn } from '@alot-web-develop/ui/lib';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { use__Name__SearchInput } from '../hooks/use__Name__SearchInput';

interface __Name__ListFiltersProps extends ComponentProps<'div'> {
  search?: string;
  onSearchChange: (search: string) => void;
}

const __Name__ListFilters = ({ search = '', onSearchChange, className, ...rest }: __Name__ListFiltersProps) => {
  const { t } = useTranslation();
  const searchInput = use__Name__SearchInput(search, onSearchChange);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} {...rest}>
      <Input
        type="search"
        aria-label={t('__feature__.list.search')}
        placeholder={t('__feature__.list.search')}
        value={searchInput.value}
        onChange={searchInput.onChange}
        className="max-w-xs"
      />
    </div>
  );
};

export { __Name__ListFilters };

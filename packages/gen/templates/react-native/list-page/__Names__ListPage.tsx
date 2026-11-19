import { PageShell } from '@alot-web-develop/ui-native/page-shell';
import { QueryBoundary } from '@alot-web-develop/ui-native/query-boundary';
import { SearchInput } from '@alot-web-develop/ui-native/search-input';
import { useTranslation } from 'react-i18next';
import { useList__Names__ } from '@/api/queries/useList__Names__';
import { __Names__List } from '../components/__Names__List';

const PAGE_SIZE = 20;

interface __Names__ListPageProps {
  search: string;
  page: number;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onSelect: (id: string) => void;
}

const __Names__ListPage = ({ search, page, onSearchChange, onPageChange, onSelect }: __Names__ListPageProps) => {
  const { t } = useTranslation();
  const query = useList__Names__({ page, limit: PAGE_SIZE, search });

  return (
    <PageShell>
      <SearchInput value={search} onSearch={onSearchChange} placeholder={t('__feature__.list.search')} />
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0}>
        {(data) => (
          <__Names__List
            items={data.items}
            page={page}
            pageCount={Math.max(1, Math.ceil(data.total / PAGE_SIZE))}
            onPageChange={onPageChange}
            onSelect={onSelect}
          />
        )}
      </QueryBoundary>
    </PageShell>
  );
};

export { __Names__ListPage };

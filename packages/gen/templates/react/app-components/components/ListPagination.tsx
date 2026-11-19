import { Button } from '@alot-web-develop/ui/button';
import { cn } from '@alot-web-develop/ui/lib';
import { Pagination, PaginationContent, PaginationItem } from '@alot-web-develop/ui/pagination';
import { useTranslation } from 'react-i18next';

interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const ListPagination = ({ page, pageSize, total, onPageChange, className }: ListPaginationProps) => {
  const { t } = useTranslation();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Pagination className={cn('justify-end', className)}>
      <PaginationContent>
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            {t('common.previous')}
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span className="px-2 text-sm text-muted-foreground">
            {t('common.pageOf', { page, pageCount })}
          </span>
        </PaginationItem>
        <PaginationItem>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
            {t('common.next')}
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export type { ListPaginationProps };
export { ListPagination };

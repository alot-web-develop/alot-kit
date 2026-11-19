import { Alert, AlertDescription, AlertTitle } from '@alot-web-develop/ui/alert';
import { Button } from '@alot-web-develop/ui/button';
import { Skeleton } from '@alot-web-develop/ui/skeleton';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  loading?: ReactNode;
  empty?: ReactNode;
  error?: ReactNode;
  children: (data: T) => ReactNode;
}

const QueryBoundary = <T,>({ query, isEmpty, loading, empty, error, children }: QueryBoundaryProps<T>) => {
  const { t } = useTranslation();

  if (query.isPending) {
    return loading ?? <Skeleton className="h-40 w-full" role="status" aria-label={t('common.loading')} />;
  }

  if (query.isError) {
    return (
      error ?? (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>
            <p>{query.error.message}</p>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              {t('common.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      )
    );
  }

  if (isEmpty?.(query.data)) {
    return empty ?? <p className="text-sm text-muted-foreground">{t('common.empty')}</p>;
  }

  return children(query.data);
};

export type { QueryBoundaryProps };
export { QueryBoundary };

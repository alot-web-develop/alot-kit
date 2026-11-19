import { useMemo } from 'react';
import { formatDate } from '@alot-web-develop/utils/format';
import { useTranslation } from 'react-i18next';
import type { DataTableColumn } from '@/components/DataTable';
import type { TOrder } from '@/types/main-api-types';

const useOrderColumns = () => {
  const { t, i18n } = useTranslation();

  return useMemo<DataTableColumn<TOrder>[]>(
    () => [
      { id: 'name', header: t('orders.list.columns.name'), cell: (order) => order.name },
      {
        id: 'createdAt',
        header: t('orders.list.columns.createdAt'),
        cell: (order) => formatDate(order.createdAt, i18n.language),
      },
    ],
    [t, i18n.language],
  );
};

export { useOrderColumns };

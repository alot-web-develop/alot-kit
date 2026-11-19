import { formatDate } from '@alot-web-develop/utils/format';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DataTableColumn } from '@/components/DataTable';
import type { T__Name__ } from '@/types/main-api-types';

const use__Name__Columns = () => {
  const { t, i18n } = useTranslation();

  return useMemo<DataTableColumn<T__Name__>[]>(
    () => [
      { id: 'name', header: t('__feature__.list.columns.name'), cell: (__name__) => __name__.name },
      {
        id: 'createdAt',
        header: t('__feature__.list.columns.createdAt'),
        cell: (__name__) => formatDate(__name__.createdAt, i18n.language),
      },
    ],
    [t, i18n.language],
  );
};

export { use__Name__Columns };

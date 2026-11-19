import { DataTable } from '@/components/DataTable';
import type { TOrder } from '@/types/main-api-types';
import { useOrderColumns } from '../hooks/useOrderColumns';

interface OrderTableProps {
  orders: TOrder[];
}

const OrderTable = ({ orders }: OrderTableProps) => {
  const columns = useOrderColumns();

  return <DataTable data={orders} columns={columns} getRowId={(order) => order.id} />;
};

export { OrderTable };

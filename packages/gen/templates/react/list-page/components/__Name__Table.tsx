import { DataTable } from '@/components/DataTable';
import type { T__Name__ } from '@/types/main-api-types';
import { use__Name__Columns } from '../hooks/use__Name__Columns';

interface __Name__TableProps {
  __names__: T__Name__[];
}

const __Name__Table = ({ __names__ }: __Name__TableProps) => {
  const columns = use__Name__Columns();

  return <DataTable data={__names__} columns={columns} getRowId={(__name__) => __name__.id} />;
};

export { __Name__Table };

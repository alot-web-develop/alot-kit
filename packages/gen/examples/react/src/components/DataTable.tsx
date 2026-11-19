import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@alot-web-develop/ui/lib';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alot-web-develop/ui/table';

interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

const DataTable = <T,>({ data, columns, getRowId, onRowClick, className }: DataTableProps<T>) => {
  const onRowKeyDown = (event: KeyboardEvent, row: T) => {
    if (event.key === 'Enter') onRowClick?.(row);
  };

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.id} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={getRowId(row)}
            className={cn(onRowClick && 'cursor-pointer')}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick && (() => onRowClick(row))}
            onKeyDown={onRowClick && ((event) => onRowKeyDown(event, row))}
          >
            {columns.map((column) => (
              <TableCell key={column.id} className={column.className}>
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export { DataTable };
export type { DataTableColumn, DataTableProps };

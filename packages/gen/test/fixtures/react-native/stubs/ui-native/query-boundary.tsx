import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
export declare const QueryBoundary: <T>(props: {
  query: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode; error?: ReactNode; loading?: ReactNode;
  children: (data: T) => ReactNode;
}) => React.JSX.Element;

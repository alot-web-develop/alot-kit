import type { ReactNode } from 'react';
import { useSession } from './index';

interface RequireAuthProps {
  children: ReactNode;
  fallback: ReactNode;
  loading?: ReactNode;
}

const RequireAuth = ({ children, fallback, loading = null }: RequireAuthProps) => {
  const { user, isPending } = useSession();

  if (isPending) return loading;

  return user ? children : fallback;
};

export { RequireAuth };

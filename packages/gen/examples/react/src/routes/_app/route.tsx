import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import { AppLayout } from '@/app/layout/AppLayout';
import { RequireAuth } from '@/lib/auth/RequireAuth';

const AppRoute = () => {
  return (
    <RequireAuth fallback={<Navigate to="/login" />}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </RequireAuth>
  );
};

const Route = createFileRoute('/_app')({ component: AppRoute });

export { Route };

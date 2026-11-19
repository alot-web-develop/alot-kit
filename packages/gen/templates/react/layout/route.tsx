import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { __Names__Layout } from '@/features/__feature__/components/__Names__Layout';

const __Names__LayoutRoute = () => {
  const { t } = useTranslation();

  return (
    <__Names__Layout title={t('__feature__.title')}>
      <Outlet />
    </__Names__Layout>
  );
};

const Route = createFileRoute('/_app/__names-kebab__')({ component: __Names__LayoutRoute });

export { Route };

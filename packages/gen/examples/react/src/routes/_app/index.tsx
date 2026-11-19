import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/PageShell';

const HomeRoute = () => {
  const { t } = useTranslation();

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-foreground">{t('common.appName')}</h1>
    </PageShell>
  );
};

const Route = createFileRoute('/_app/')({ component: HomeRoute });

export { Route };

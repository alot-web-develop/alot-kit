import { PageShell } from '@alot-web-develop/ui-native/page-shell';
import { Text } from '@alot-web-develop/ui-native/text';
import { useTranslation } from 'react-i18next';

const HomeRoute = () => {
  const { t } = useTranslation();

  return (
    <PageShell>
      <Text variant="title">{t('common.home')}</Text>
    </PageShell>
  );
};

export default HomeRoute;

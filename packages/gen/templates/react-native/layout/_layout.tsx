import { useThemeColors } from '@alot-web-develop/ui-native/theme';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

const __Name__Layout = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        title: t('__feature__.title'),
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
};

export default __Name__Layout;

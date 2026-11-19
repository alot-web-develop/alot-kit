import { useThemeColors } from '@alot-web-develop/ui-native/theme';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

const OrderLayout = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        title: t('orders.title'),
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
};

export default OrderLayout;

import { useThemeColors } from '@alot-web-develop/ui-native/theme';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { RequireAuth } from '@/lib/auth';

const AppLayout = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <RequireAuth>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('common.home') }} />
      </Tabs>
    </RequireAuth>
  );
};

export default AppLayout;

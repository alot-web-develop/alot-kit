import '../global.css';
import { Slot } from 'expo-router';
import { AppProviders } from '@/providers/AppProviders';

const RootLayout = () => {
  return (
    <AppProviders>
      <Slot />
    </AppProviders>
  );
};

export default RootLayout;

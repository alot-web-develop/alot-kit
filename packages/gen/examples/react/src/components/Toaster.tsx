import type { ComponentProps } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/lib/theme/ThemeProvider';

const Toaster = (props: ComponentProps<typeof SonnerToaster>) => {
  const { theme } = useTheme();

  return <SonnerToaster theme={theme} {...props} />;
};

export { Toaster };

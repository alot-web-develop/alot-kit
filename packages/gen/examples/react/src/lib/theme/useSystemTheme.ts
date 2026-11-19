import { useSyncExternalStore } from 'react';
import type { TResolvedTheme } from './theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);

  return () => media.removeEventListener('change', onChange);
};

const getSnapshot = (): TResolvedTheme => (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light');

const useSystemTheme = () => useSyncExternalStore(subscribe, getSnapshot);

export { useSystemTheme };

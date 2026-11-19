import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

type TThemeMode = 'light' | 'dark' | 'system';

interface TThemeContextValue {
  mode: TThemeMode;
  setMode: (mode: TThemeMode) => void;
}

const STORAGE_KEY = 'theme-mode';

const isThemeMode = (value: string | null): value is TThemeMode =>
  value === 'light' || value === 'dark' || value === 'system';

const ThemeContext = createContext<TThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setModeState] = useState<TThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (isThemeMode(stored)) setModeState(stored);
    });
  }, []);

  useEffect(() => {
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  }, [mode]);

  const setMode = useCallback((next: TThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within ThemeProvider');
  return context;
};

export { ThemeProvider, useThemeMode };
export type { TThemeMode };

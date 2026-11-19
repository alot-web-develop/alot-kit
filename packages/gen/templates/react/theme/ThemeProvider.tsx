import { createContext, type ReactNode, use, useCallback, useEffect, useMemo, useState } from 'react';
import { applyTheme, readStoredTheme, storeTheme, type TResolvedTheme, type TTheme } from './theme';
import { useSystemTheme } from './useSystemTheme';

interface ThemeContextValue {
  theme: TTheme;
  resolvedTheme: TResolvedTheme;
  setTheme: (theme: TTheme) => void;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: TTheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ThemeProvider = ({ children, defaultTheme = 'system' }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState(() => readStoredTheme(defaultTheme));
  const systemTheme = useSystemTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: TTheme) => {
    storeTheme(next);
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
};

const useTheme = () => {
  const context = use(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');

  return context;
};

export { ThemeProvider, useTheme };

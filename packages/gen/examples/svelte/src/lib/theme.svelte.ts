import { getContext, setContext } from 'svelte';

type ThemeMode = 'light' | 'dark' | 'system';
interface ThemeContext { readonly mode: ThemeMode; setMode: (mode: ThemeMode) => void }
const themeKey = Symbol('theme');
const provideTheme = (value: ThemeContext) => setContext(themeKey, value);
const useTheme = (): ThemeContext => {
  const value = getContext<ThemeContext | undefined>(themeKey);
  if (!value) throw new Error('ThemeProvider is missing');
  return value;
};

export { provideTheme, useTheme };
export type { ThemeMode, ThemeContext };

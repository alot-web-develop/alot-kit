const THEMES = ['light', 'dark', 'system'] as const;
const STORAGE_KEY = 'theme';

type TTheme = (typeof THEMES)[number];
type TResolvedTheme = Exclude<TTheme, 'system'>;

const isTheme = (value: unknown): value is TTheme => THEMES.some((theme) => theme === value);

const readStoredTheme = (fallback: TTheme): TTheme => {
  const stored = localStorage.getItem(STORAGE_KEY);

  return isTheme(stored) ? stored : fallback;
};

const storeTheme = (theme: TTheme) => localStorage.setItem(STORAGE_KEY, theme);

const nextTheme = (theme: TTheme): TTheme => THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? 'system';

const applyTheme = (theme: TResolvedTheme) => document.documentElement.classList.toggle('dark', theme === 'dark');

export { THEMES, isTheme, readStoredTheme, storeTheme, nextTheme, applyTheme };
export type { TTheme, TResolvedTheme };

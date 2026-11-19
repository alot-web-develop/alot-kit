import type { TSemanticColor } from "./colors.js";

type TColorScheme = "light" | "dark";

type TThemeColors = Record<TSemanticColor, string>;

interface TTypefaces {
  sans: string;
  heading: string;
  mono: string;
}

interface TTheme {
  name: string;
  schemes: readonly TColorScheme[];
  colors: Record<TColorScheme, TThemeColors>;
  radius: string;
  typefaces: TTypefaces;
}

type TDeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? TDeepPartial<T[K]> : T[K];
};

export type { TColorScheme, TDeepPartial, TTheme, TThemeColors, TTypefaces };

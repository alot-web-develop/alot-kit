import { SEMANTIC_COLORS, type TSemanticColor } from "./colors.js";
import { createTheme } from "./theme.js";
import { themes } from "./themes/index.js";
import type { TColorScheme, TTheme, TTypefaces } from "./types.js";

type TCamelCase<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<TCamelCase<Tail>>}`
  : S;

type TNativeColors = { [K in TSemanticColor as TCamelCase<K>]: string };

interface TNativeRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
}

interface TNativeTheme {
  name: string;
  schemes: readonly TColorScheme[];
  colors: Record<TColorScheme, TNativeColors>;
  radius: TNativeRadius;
  typefaces: TTypefaces;
}

const ROOT_FONT_SIZE = 16;

const toCamelCase = (name: string) =>
  name.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());

const toPixels = (value: string) => {
  const match = /^(\d*\.?\d+)(rem|px)$/.exec(value.trim());
  if (!match) throw new Error(`Unsupported radius: ${value}`);
  const amount = Number(match[1]);
  return match[2] === "rem" ? amount * ROOT_FONT_SIZE : amount;
};

const toNativeColors = (theme: TTheme, scheme: TColorScheme) =>
  Object.fromEntries(
    SEMANTIC_COLORS.map((name) => [
      toCamelCase(name),
      theme.colors[scheme][name],
    ]),
  ) as TNativeColors;

const toNativeTheme = (theme: TTheme): TNativeTheme => {
  const radius = toPixels(theme.radius);
  return {
    name: theme.name,
    schemes: theme.schemes,
    colors: {
      light: toNativeColors(theme, "light"),
      dark: toNativeColors(theme, "dark"),
    },
    radius: {
      sm: radius - 4,
      md: radius - 2,
      lg: radius,
      xl: radius + 4,
      "2xl": radius + 8,
    },
    typefaces: theme.typefaces,
  };
};

const nativeThemes = { default: toNativeTheme(themes.default) } as const;

export type { TNativeColors, TNativeRadius, TNativeTheme };
export { createTheme, nativeThemes, toNativeTheme };

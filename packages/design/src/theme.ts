import { deepMerge } from "./merge.js";
import type { TDeepPartial, TTheme } from "./types.js";

const createTheme = (
  base: TTheme,
  overrides: TDeepPartial<TTheme> = {},
): TTheme => deepMerge(base, overrides);

export { createTheme };

import { defaultTheme } from "./default.js";

const themes = { default: defaultTheme } as const;

type TThemeName = keyof typeof themes;

export type { TThemeName };
export { defaultTheme, themes };

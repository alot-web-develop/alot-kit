import { defaultTheme } from "../../src/themes/default.js";
import { noirTheme } from "./noir.js";
import { tideTheme } from "./tide.js";

const brandFixtures = { noir: noirTheme, tide: tideTheme } as const;

const allThemes = [defaultTheme, noirTheme, tideTheme] as const;

export { allThemes, brandFixtures, noirTheme, tideTheme };

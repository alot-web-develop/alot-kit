import { expect, test } from "vitest";
import { createTheme, nativeThemes, toNativeTheme } from "../src/native.js";
import { themes } from "../src/themes/index.js";
import { tideTheme } from "./fixtures/index.js";

test("native themes expose camelCase colors and pixel radius", () => {
  expect(nativeThemes.default.colors.dark.surface2).toBe(
    themes.default.colors.dark["surface-2"],
  );
  const theme = toNativeTheme(tideTheme);
  expect(theme.colors.light.primaryForeground).toBe(
    tideTheme.colors.light["primary-foreground"],
  );
  expect(theme.colors.dark.surface1).toBe(tideTheme.colors.dark["surface-1"]);
  expect(theme.radius).toEqual({ sm: 8, md: 10, lg: 12, xl: 16, "2xl": 20 });
});

test("createTheme deep-merges overrides without mutating the base", () => {
  const brand = createTheme(themes.default, {
    name: "brand",
    radius: "4px",
    colors: { light: { primary: "#123456" } },
  });
  expect(brand.colors.light.primary).toBe("#123456");
  expect(brand.colors.light.background).toBe(
    themes.default.colors.light.background,
  );
  expect(brand.colors.dark.primary).toBe(themes.default.colors.dark.primary);
  expect(themes.default.colors.light.primary).not.toBe("#123456");
  expect(toNativeTheme(brand).radius.lg).toBe(4);
});

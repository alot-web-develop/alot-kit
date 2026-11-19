import { expect, test } from "vitest";
import {
  renderNativewindCss,
  renderTailwindCss,
  renderThemeOverrideCss,
  SEMANTIC_COLORS,
  themes,
} from "../src/index.js";
import { noirTheme, tideTheme } from "./fixtures/index.js";

test("tailwind.css maps every semantic token to a CSS variable and binds dark to .dark", () => {
  const css = renderTailwindCss(themes.default);
  for (const name of SEMANTIC_COLORS)
    expect(css).toContain(`--color-${name}: var(--${name});`);
  expect(css).toContain("@custom-variant dark (&:where(.dark, .dark *));");
  expect(css).toContain("@theme inline {");
  expect(css).toMatch(/:root \{\n {2}--radius: 0\.625rem;/);
  expect(css).toContain(".dark {\n  color-scheme: dark;");
});

test("nativewind.css uses prefers-color-scheme and no class selectors", () => {
  const css = renderNativewindCss(themes.default);
  expect(css).toContain("@media (prefers-color-scheme: dark) {\n  :root {");
  expect(css).not.toContain(".dark");
  expect(css).not.toContain("@custom-variant");
  expect(css).not.toContain("color-scheme: dark;");
  expect(css).toContain("--radius: 10px;");
});

test("dark-only brand themes put dark values on :root", () => {
  const css = renderThemeOverrideCss(noirTheme, "class");
  expect(css).toContain(":root {\n  color-scheme: dark;");
  expect(css).toContain(`--background: ${noirTheme.colors.dark.background};`);
  expect(css).not.toContain(".dark");
  expect(renderThemeOverrideCss(noirTheme, "media")).not.toContain("@media");
});

test("brand theme overrides only redefine variables", () => {
  const css = renderThemeOverrideCss(tideTheme, "class");
  expect(css).not.toContain("@theme");
  expect(css).toContain(`--primary: ${tideTheme.colors.light.primary};`);
  expect(css).toContain(`.dark {`);
});

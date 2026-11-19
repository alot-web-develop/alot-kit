import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "@tailwindcss/node";
import { expect, test } from "vitest";
import {
  renderNativewindCss,
  renderTailwindCss,
  renderThemeOverrideCss,
  themes,
} from "../src/index.js";
import { noirTheme } from "./fixtures/index.js";

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const build = async (
  files: Record<string, string>,
  entry: string,
  candidates: string[],
) => {
  const dir = mkdtempSync(join(tmpdir(), "alot-design-consumer-"));
  for (const [name, content] of Object.entries(files))
    writeFileSync(join(dir, name), content);
  const compiler = await compile(files[entry] ?? "", {
    base: dir,
    onDependency: () => {},
  });
  return compiler.build(candidates);
};

const APP_CSS = `@import "${join(packageDir, "node_modules/tailwindcss/index.css")}";
@import "./design.css";

:root {
  --primary: #ff0000;
  --pending: #00aa00;
}

.dark {
  --primary: #aa0000;
}

@theme inline {
  --color-pending: var(--pending);
}
`;

test("a consumer app extends the web tokens: brand override, extra token, dark class, radius and fonts", async () => {
  const css = await build(
    { "design.css": renderTailwindCss(themes.default), "app.css": APP_CSS },
    "app.css",
    [
      "bg-primary",
      "text-primary-foreground",
      "bg-pending",
      "bg-surface-1",
      "dark:bg-surface-2",
      "rounded-lg",
      "font-heading",
    ],
  );
  expect(css).toMatch(/\.bg-primary \{\s*background-color: var\(--primary\);/);
  expect(css).toMatch(/\.bg-pending \{\s*background-color: var\(--pending\);/);
  expect(css).toContain("--primary: #ff0000;");
  expect(css).toContain("--primary: #aa0000;");
  expect(css).toMatch(
    /\.dark\\:bg-surface-2:where\(\.dark, \.dark \*\) \{\s*background-color: var\(--surface-2\);/,
  );
  expect(css).toMatch(/\.rounded-lg \{\s*border-radius: var\(--radius\);/);
  expect(css).toMatch(
    /\.font-heading \{\s*font-family: var\(--typeface-heading\);/,
  );
  expect(css.indexOf("--primary: #ff0000;")).toBeGreaterThan(
    css.indexOf(`--primary: ${themes.default.colors.light.primary};`),
  );
});

test("an app brand theme (rendered from createTheme-style data) overrides the defaults when imported after tailwind.css", async () => {
  const appCss = `@import "${join(packageDir, "node_modules/tailwindcss/index.css")}";
@import "./design.css";
@import "./noir.css";
`;
  const css = await build(
    {
      "design.css": renderTailwindCss(themes.default),
      "noir.css": renderThemeOverrideCss(noirTheme, "class"),
      "app.css": appCss,
    },
    "app.css",
    ["bg-background"],
  );
  expect(
    css.lastIndexOf(`--background: ${noirTheme.colors.dark.background};`),
  ).toBeGreaterThan(
    css.lastIndexOf(`--background: ${themes.default.colors.dark.background};`),
  );
});

test("the native entry compiles dark: to prefers-color-scheme", async () => {
  const appCss = `@import "${join(packageDir, "node_modules/tailwindcss/index.css")}";
@import "./design.css";
`;
  const css = await build(
    { "design.css": renderNativewindCss(themes.default), "app.css": appCss },
    "app.css",
    ["dark:bg-surface-2"],
  );
  expect(css).toContain("@media (prefers-color-scheme: dark)");
  expect(css).not.toMatch(/:where\(\.dark/);
});

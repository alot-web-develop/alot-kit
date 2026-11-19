# @alot-web-develop/design

Design tokens shared by every alot app: semantic colors, radius and typefaces, with one TypeScript source and outputs for Tailwind v4 (web, Svelte), NativeWind v5 (React Native) and StyleSheet/Paper themes.

| Import                                    | Use                                                                               |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `@alot-web-develop/design/tailwind.css`   | web / Svelte app stylesheet, after `@import "tailwindcss"`; dark mode via `.dark` |
| `@alot-web-develop/design/nativewind.css` | React Native `global.css`; dark mode via `prefers-color-scheme`                   |
| `@alot-web-develop/design/tokens.css`     | plain CSS variables, no Tailwind                                                  |
| `@alot-web-develop/design`                | `themes`, `createTheme`, `SEMANTIC_COLORS`, `contrastRatio`, CSS renderers        |
| `@alot-web-develop/design/native`         | `nativeThemes`, `toNativeTheme` (camelCase colors, px radius)                     |

## Extend in a project

```css
@import "tailwindcss";
@import "@alot-web-develop/design/tailwind.css";

:root {
  --primary: #ff5a1f;
  --pending: #f59e0b;
  --pending-foreground: #0a0a0a;
}

.dark {
  --primary: #ff7a45;
}

@theme inline {
  --color-pending: var(--pending);
  --color-pending-foreground: var(--pending-foreground);
}
```

In React Native, put dark overrides in `@media (prefers-color-scheme: dark) { :root { … } }` instead of `.dark`.

In TypeScript: `createTheme(themes.default, { colors: { light: { primary: "#ff5a1f" } } })`.

## Brand themes live in the app

The package ships one neutral `default` theme. A product's brand (colors, radius, typefaces) is defined in that product's repo, never here:

- CSS: redefine the variables after the import, as above. Put them in `src/styles/theme.css` (web) or `global.css` (React Native).
- TypeScript (StyleSheet, `react-native-paper`, generated CSS): `createTheme(themes.default, { name: "acme", colors: { … } })`, then `toNativeTheme(theme)` or `renderThemeOverrideCss(theme, "class" | "media")`.

A dark-only brand sets `schemes: ["dark"]`: its dark values go on `:root` with `color-scheme: dark`.

The tests use two brand fixtures (noir, dark-only; tide, light + dark) in `test/fixtures/`. They keep the token structure and the AA rule checked against realistic brands.

## Rules

- Components use semantic names only (`bg-surface-1`, `text-muted-foreground`), never raw colors.
- A theme defines every semantic color for each scheme it supports, and every text pair must pass WCAG AA (`contrastRatio`, `CONTRAST_PAIRS`). Run the same check in the app for its brand theme.
- Project-specific tokens (e.g. order status colors) stay in the app stylesheet, not here.

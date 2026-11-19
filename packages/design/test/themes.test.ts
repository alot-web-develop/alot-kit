import { describe, expect, test } from "vitest";
import {
  CONTRAST_PAIRS,
  contrastRatio,
  SEMANTIC_COLORS,
} from "../src/index.js";
import { allThemes } from "./fixtures/index.js";

const AA_TEXT = 4.5;

describe.each(allThemes)("$name theme", (theme) => {
  test.each(theme.schemes)(
    "%s scheme defines every semantic color as #rrggbb",
    (scheme) => {
      const colors = theme.colors[scheme];
      expect(Object.keys(colors).sort()).toEqual([...SEMANTIC_COLORS].sort());
      for (const name of SEMANTIC_COLORS)
        expect(colors[name], name).toMatch(/^#[0-9a-f]{6}$/);
    },
  );

  test.each(theme.schemes)("%s scheme text pairs meet WCAG AA", (scheme) => {
    const failures = CONTRAST_PAIRS.map(([background, foreground]) => ({
      pair: `${foreground} on ${background}`,
      ratio: contrastRatio(
        theme.colors[scheme][background],
        theme.colors[scheme][foreground],
      ),
    })).filter(({ ratio }) => ratio < AA_TEXT);
    expect(failures).toEqual([]);
  });
});

test("contrast ratio matches the WCAG reference values", () => {
  expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
});

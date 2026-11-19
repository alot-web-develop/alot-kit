import { expect, test } from "vitest";
import { renderConditions } from "../src/conditions.js";
import { parseConfig } from "../src/config.js";
import { matchesWhen } from "../src/render.js";

test("conditions preserve legacy module defaults even for programmatic config", () => {
  const config = parseConfig({ framework: "fastify" });
  delete config.modules;
  expect(matchesWhen(config, { mobile: "on", uploads: "on" })).toBe(true);
  const source =
    "before\n// @alot-if mobile=on\nmobile\n// @alot-else\nweb\n// @alot-endif\nafter\n";
  expect(renderConditions(source, config)).toBe("before\nmobile\nafter\n");
  expect(renderConditions(source, { ...config, modules: [] })).toBe(
    "before\nweb\nafter\n",
  );
  expect(() => renderConditions("// @alot-if mobile=on\n", config)).toThrow(
    /unclosed/,
  );
  expect(() => renderConditions("// @alot-else\n", config)).toThrow(
    /unexpected/,
  );
});

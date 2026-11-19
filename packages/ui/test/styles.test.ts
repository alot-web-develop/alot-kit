import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { expect, test } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
test("the shipped stylesheet imports design and discovers actual component utilities", async () => {
  const compiler = await compile(
    `@import "tailwindcss";\n@import "./dist/styles.css";`,
    { base: root, onDependency: () => {} },
  );
  const scanner = new Scanner({ sources: compiler.sources });
  const candidates = scanner.scan();
  expect(candidates).toContain("bg-primary");
  expect(candidates).toContain("text-primary-foreground");
  expect(candidates).toContain("bg-foreground/50");
  const css = compiler.build(candidates);
  expect(css).toMatch(/\.bg-primary\s*\{\s*background-color: var\(--primary\)/);
  expect(css).toContain("--primary:");
  expect(css).toContain("--radius:");
  expect(css).toContain(".animate-in");
  expect(readFileSync(join(root, "dist/styles.css"), "utf8")).toContain(
    '@import "@alot-web-develop/design/tailwind.css"',
  );
});

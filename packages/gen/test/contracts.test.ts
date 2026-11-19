import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, test } from "vitest";
import { generateApiContracts } from "../src/api-contracts.js";

const dirs: string[] = [];
const fixture = () => {
  const cwd = mkdtempSync(join(tmpdir(), "alot-contracts-"));
  dirs.push(cwd);
  const document = {
    openapi: "3.0.3",
    info: { title: "Contracts", version: "1" },
    paths: {},
    components: {
      schemas: {
        Order: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        CreateOrderRequest: {
          type: "object",
          properties: { name: { type: "string" } },
        },
      },
    },
  };
  writeFileSync(join(cwd, "openapi.json"), JSON.stringify(document));
  return { cwd, document };
};
afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

test("contract drift checks tolerate real Biome formatting and still reject malformed output", async () => {
  const { cwd } = fixture();
  const path = await generateApiContracts({ cwd, input: "openapi.json" });
  const original = readFileSync(path, "utf8");
  writeFileSync(
    join(cwd, "biome.json"),
    JSON.stringify({
      formatter: { indentStyle: "space", indentWidth: 2 },
      javascript: {
        formatter: { quoteStyle: "single", semicolons: "asNeeded" },
      },
    }),
  );
  const biome = fileURLToPath(
    new URL("../../../node_modules/.bin/biome", import.meta.url),
  );
  execFileSync(biome, ["format", "--write", path], { cwd, stdio: "pipe" });
  expect(readFileSync(path, "utf8")).not.toBe(original);
  await generateApiContracts({ cwd, input: "openapi.json", check: true });
  const formatted = readFileSync(path, "utf8");
  const closing = formatted.lastIndexOf("}");
  writeFileSync(
    path,
    formatted.slice(0, closing) + formatted.slice(closing + 1),
  );
  await expect(
    generateApiContracts({ cwd, input: "openapi.json", check: true }),
  ).rejects.toThrow(/stale/);
});

test("generates named aliases from real OpenAPI and detects contract drift without writing", async () => {
  const { cwd, document } = fixture();
  const path = await generateApiContracts({ cwd, input: "openapi.json" });
  const first = readFileSync(path, "utf8");
  expect(first).toContain('type TOrder = components["schemas"]["Order"]');
  expect(first).toContain(
    'type TCreateOrderRequest = components["schemas"]["CreateOrderRequest"]',
  );
  await generateApiContracts({ cwd, input: "openapi.json", check: true });
  document.components.schemas.Order.properties.id.type = "integer";
  writeFileSync(join(cwd, "openapi.json"), JSON.stringify(document));
  await expect(
    generateApiContracts({ cwd, input: "openapi.json", check: true }),
  ).rejects.toThrow(/stale/);
  expect(readFileSync(path, "utf8")).toBe(first);
  await generateApiContracts({ cwd, input: "openapi.json" });
  expect(readFileSync(path, "utf8")).toContain("id: number");
});

test("HTTP input emits the same aliases, and hand-written destinations are preserved", async () => {
  const { cwd, document } = fixture();
  const server = createServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(document));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("no fixture address");
    const path = await generateApiContracts({
      cwd,
      input: `http://127.0.0.1:${address.port}/openapi.json`,
    });
    expect(readFileSync(path, "utf8")).toContain(
      'type TOrder = components["schemas"]["Order"]',
    );
    writeFileSync(path, "export type TOrder = { handmade: true };\n");
    await expect(
      generateApiContracts({ cwd, input: "openapi.json" }),
    ).rejects.toThrow(/not generated/);
    expect(readFileSync(path, "utf8")).toContain("handmade");
    await expect(
      generateApiContracts({
        cwd,
        input: "openapi.json",
        output: "../escape.ts",
      }),
    ).rejects.toThrow();
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

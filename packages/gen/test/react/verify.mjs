import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createdPaths,
  createGen,
  install,
  packKit,
  repoRoot,
  run,
  useTarballs,
} from "../support/kit.mjs";

const gen = fileURLToPath(new URL("../..", import.meta.url));
const templates = join(gen, "templates/react");
const fixture = join(gen, "test/fixtures/react");
const out = mkdtempSync(join(tmpdir(), "alot-gen-react-"));
const generated = new Set();

try {
  const tarballs = packKit(
    ["design", "ui", "utils", "api", "gen"],
    `${out}-tarballs`,
  );
  cpSync(fixture, out, { recursive: true });
  const writeConfig = (role) =>
    writeFileSync(
      join(out, "alot.config.json"),
      `${JSON.stringify({ framework: "react", role }, null, 2)}\n`,
    );
  writeConfig("app");
  useTarballs(out, tarballs, ["@alot-web-develop/gen"]);
  install(out, [
    "--config.auto-install-peers=false",
    "--config.strict-peer-dependencies=false",
  ]);
  const alotGen = createGen(out);
  const schemas = {};
  for (const entity of ["Order", "OrderItem", "Category"]) {
    schemas[entity] = {
      type: "object",
      required: ["id", "name", "createdAt"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        createdAt: { type: "string" },
      },
    };
    schemas[`${entity}ListQuery`] = {
      type: "object",
      properties: {
        page: { type: "integer" },
        limit: { type: "integer" },
        search: { type: "string" },
      },
    };
    schemas[`${entity}ListResponse`] = {
      type: "object",
      required: ["items", "total"],
      properties: {
        items: {
          type: "array",
          items: { $ref: `#/components/schemas/${entity}` },
        },
        total: { type: "integer" },
      },
    };
    for (const operation of ["Create", "Update"])
      schemas[`${operation}${entity}Request`] = {
        type: "object",
        ...(operation === "Create" ? { required: ["name"] } : {}),
        properties: { name: { type: "string" } },
      };
  }
  writeFileSync(
    join(out, "openapi.json"),
    JSON.stringify({
      openapi: "3.0.3",
      info: { title: "Fixture", version: "1" },
      paths: {},
      components: { schemas },
    }),
  );
  alotGen(["api-contracts", "--input", "openapi.json", "--force"]);
  alotGen(["api-contracts", "--input", "openapi.json", "--check"]);
  const generate = (kind, name, ...flags) => {
    for (const dest of createdPaths(alotGen([kind, name, ...flags])))
      generated.add(dest);
  };
  alotGen(["list"]);
  const init = [
    "env",
    "api-client",
    "query-client",
    "auth",
    "i18n",
    "theme",
    "providers",
    "app-entry",
    "app-layout",
  ];
  for (const kind of init) generate(kind, "App");
  const names = {
    subcomponent: "OrderSummary",
    composite: "OrderPanel",
    hook: "OrderFilters",
    util: "formatOrderCode",
    context: "OrderSelection",
    store: "OrderSelection",
    primitive: "StatusChip",
  };
  const kinds = readdirSync(templates).filter((kind) =>
    existsSync(join(templates, kind, "template.json")),
  );
  for (const kind of kinds.filter((kind) => !init.includes(kind))) {
    const manifest = JSON.parse(
      readFileSync(join(templates, kind, "template.json"), "utf8"),
    );
    const flags = [];
    if (manifest.requiresFeature) flags.push("--feature", "orders");
    if (manifest.requiresEntity) flags.push("--entity", "Order");
    const role = manifest.role.includes("app") ? "app" : manifest.role[0];
    writeConfig(role);
    generate(kind, names[kind] ?? "Order", ...flags);
    writeConfig("app");
  }
  const store = JSON.parse(
    readFileSync(join(templates, "store/template.json"), "utf8"),
  );
  generate(
    "store",
    "OrderPreferences",
    "--feature",
    "orders",
    ...(store.files.some((file) => file.flag === "persist")
      ? ["--persist"]
      : ["--variant", "persist"]),
  );
  for (const kind of ["service", "query-keys", "query", "mutation"]) {
    generate(kind, "OrderItem", "--parent", "Order");
  }
  // Lexically different entity names exercise sorting after placeholder expansion.
  generate("service", "Category");
  run("pnpm", ["run", "routes"], { cwd: out });
  run(join(repoRoot, "node_modules/.bin/biome"), ["check", "src"], {
    cwd: out,
  });
  run("pnpm", ["run", "typecheck"], { cwd: out });
  run("pnpm", ["run", "build"], { cwd: out });
  run("pnpm", ["test"], { cwd: out });
  run(
    "node",
    [
      "--input-type=module",
      "-e",
      `
    import assert from 'node:assert/strict';
    globalThis.window = undefined;
    globalThis.document = undefined;
    globalThis.FormData = undefined;
    globalThis.Blob = undefined;
    globalThis.URL = undefined;
    const root = await import('@alot-web-develop/utils');
    for (const subpath of ['dates', 'format', 'filters', 'strings', 'query', 'collections', 'async', 'files']) {
      const module = await import('@alot-web-develop/utils/' + subpath);
      for (const [name, value] of Object.entries(module)) assert.equal(root[name], value);
    }
    assert.equal(root.formatDate('2026-01-02', 'it-IT', {timeZone:'UTC',pattern:'D MMMM YYYY'}), '2 gennaio 2026');
    assert.equal(root.dayjs.isDayjs(root.parseDate('2024-02-29')), true);
    console.log('Packed ESM subpaths and SSR import without browser/file globals passed');
  `,
    ],
    { cwd: out },
  );
  if (process.argv.includes("--update-examples")) {
    const examples = join(gen, "examples/react");
    rmSync(join(examples, "src"), { recursive: true, force: true });
    for (const dest of generated) {
      mkdirSync(dirname(join(examples, dest)), { recursive: true });
      cpSync(join(out, dest), join(examples, dest));
    }
  }
  console.log(`Verified ${kinds.length} React kinds and persisted store`);
} finally {
  rmSync(out, { recursive: true, force: true });
  rmSync(`${out}-tarballs`, { recursive: true, force: true });
}

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const gen = resolve(here, "../..");
const fixture = join(gen, "test/fixtures/svelte");
const templates = join(gen, "templates");
const out = process.env.SVELTE_FIXTURE_DIR
  ? resolve(process.env.SVELTE_FIXTURE_DIR)
  : mkdtempSync(join(tmpdir(), "alot-gen-svelte-"));
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      PUBLIC_API_URL: "https://api.example.test",
      npm_config_cache: join(tmpdir(), "alot-svelte-npm-cache"),
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} exited ${result.status}`);
};

if (existsSync(out) && readdirSync(out).length > 0) {
  const pkg = join(out, "package.json");
  if (
    !existsSync(pkg) ||
    JSON.parse(readFileSync(pkg, "utf8")).name !==
      "alot-svelte-template-fixture"
  )
    throw new Error(
      "Output must be empty or an existing Svelte template fixture",
    );
}
mkdirSync(out, { recursive: true });
for (const path of ["src", "stubs", "test", ".svelte-kit"])
  rmSync(join(out, path), { recursive: true, force: true });
cpSync(fixture, out, { recursive: true });
const kinds = readdirSync(join(templates, "svelte"))
  .filter((kind) =>
    existsSync(join(templates, "svelte", kind, "template.json")),
  )
  .sort();
for (const kind of kinds)
  run(
    process.execPath,
    [
      join(here, "prototype.mjs"),
      templates,
      out,
      "svelte",
      kind,
      "Order",
      "orders",
      "Order",
      "Orders",
    ],
    gen,
  );
run(
  process.execPath,
  [
    join(here, "prototype.mjs"),
    templates,
    out,
    "svelte",
    "store",
    "Preferences",
    "orders",
    "Order",
    "",
    "--persisted",
  ],
  gen,
);

run(
  "npm",
  [
    "install",
    "--package-lock=false",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ],
  out,
);
const require = createRequire(join(out, "package.json"));
const { compile } = require("svelte/compiler");
for (const kind of kinds) {
  const dir = join(templates, "svelte", kind);
  for (const file of readdirSync(dir, { recursive: true }).filter((file) =>
    file.endsWith(".svelte"),
  )) {
    const filename = join(dir, file);
    const result = compile(readFileSync(filename, "utf8"), {
      filename,
      generate: "client",
    });
    if (result.warnings.length)
      throw new Error(
        `${filename}: ${result.warnings.map((warning) => warning.code).join(", ")}`,
      );
  }
}
run("npm", ["run", "check"], out);
run("npm", ["test"], out);
if (process.argv.includes("--update-examples")) {
  const examples = join(gen, "examples/svelte/src");
  rmSync(examples, { recursive: true, force: true });
  cpSync(join(out, "src"), examples, { recursive: true });
}
console.log(`Verified ${kinds.length} kinds and persisted store: ${out}`);

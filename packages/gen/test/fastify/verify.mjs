import {
  cpSync,
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
  createGen,
  install,
  packKit,
  run,
  useTarballs,
} from "../support/kit.mjs";

const gen = fileURLToPath(new URL("../..", import.meta.url));
const root = mkdtempSync(join(tmpdir(), "alot-gen-fastify-"));
const keep = process.argv.includes("--keep");
const variants = process.argv.includes("--db=mongoose")
  ? ["mongoose"]
  : process.argv.includes("--db=mongodb-native")
    ? ["mongodb-native"]
    : ["mongodb-native", "mongoose"];
const noModules = process.argv.includes("--modules=none");
const requests = [
  ["env", "App"],
  ["db", "App"],
  ["auth", "App"],
  ["server-entry", "App"],
  ["resource", "Order"],
  ["test", "Order"],
  ["route", "Report"],
  ["service", "Pricing"],
  ["schema", "Customer"],
  ["model", "Customer"],
  ["plugin", "Billing"],
  ["middleware", "WebhookSecret"],
  ["job", "Reconcile"],
  ["resource", "OrderItem"],
];

try {
  const tarballs = packKit(["server", "gen"], join(root, "tarballs"));
  const kinds = readdirSync(join(gen, "templates/fastify")).filter(
    (kind) => !kind.startsWith("."),
  );
  for (const kind of kinds) {
    if (!requests.some(([requested]) => kind === requested))
      throw new Error(`Unverified Fastify kind: ${kind}`);
  }
  for (const db of variants) {
    const out = join(root, db);
    cpSync(join(gen, "test/fixtures/fastify"), out, { recursive: true });
    const config = { framework: "fastify", role: "api", db, schema: "zod" };
    if (noModules) {
      config.modules = [];
      // The generated app must not need the Expo plugin or the mobile/R2 checks.
      for (const check of ["mobile-auth", "env-r2"]) {
        rmSync(join(out, `checks/${check}.check.ts`));
      }
      cpSync(
        join(gen, "test/fixtures/fastify-no-modules/modules.check.ts"),
        join(out, "checks/modules.check.ts"),
      );
      const manifestPath = join(out, "package.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      delete manifest.dependencies["@better-auth/expo"];
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    }
    writeFileSync(
      join(out, "alot.config.json"),
      `${JSON.stringify(config, null, 2)}\n`,
    );
    const tsPackages = { ...tarballs };
    useTarballs(out, tsPackages, ["@alot-web-develop/gen"]);
    install(out);
    const alotGen = createGen(out);
    alotGen(["list"]);
    for (const [kind, name] of requests) alotGen([kind, name]);
    const again = alotGen(["resource", "Order"]);
    if (/^created /m.test(again) || /^wired /m.test(again))
      throw new Error("Second generation run was not idempotent");
    alotGen(["snippets"]);
    cpSync(
      join(out, "testing/app-helper.txt"),
      join(out, "test/helpers/app.ts"),
    );
    for (const file of readdirSync(join(out, "src"), { recursive: true })) {
      if (
        file.endsWith(".ts") &&
        /__(?:Name|name|NAME|Names|names|feature|Entity|entity)(?:-kebab)?__/.test(
          readFileSync(join(out, "src", file), "utf8"),
        )
      ) {
        throw new Error(`Unexpanded placeholder: ${file}`);
      }
    }
    const configPath = join(out, "vitest.config.ts");
    writeFileSync(
      configPath,
      readFileSync(configPath, "utf8").replace(
        "test: {",
        "test: {\n    setupFiles: ['./testing/setup.ts'],",
      ),
    );
    run("pnpm", ["typecheck"], { cwd: out });
    run("pnpm", ["test"], { cwd: out });
    if (process.argv.includes("--update-examples") && !noModules) {
      const examples = join(gen, "examples/fastify", db);
      rmSync(examples, { recursive: true, force: true });
      mkdirSync(examples, { recursive: true });
      for (const dest of [
        "src",
        "test/helpers",
        "test/routes",
        "vitest.config.ts",
        ".env.example",
      ]) {
        mkdirSync(dirname(join(examples, dest)), { recursive: true });
        // Keep the production generator's DB-backed helper in published examples.
        const source =
          dest === "test/helpers" || dest === "vitest.config.ts"
            ? join(gen, "templates/fastify/server-entry", dest)
            : join(out, dest);
        cpSync(source, join(examples, dest), { recursive: true });
      }
    }
    console.log(
      `Verified ${kinds.length} Fastify kinds (${db}${noModules ? ", modules none" : ""}): ${out}`,
    );
  }
} finally {
  if (!keep) rmSync(root, { recursive: true, force: true });
}

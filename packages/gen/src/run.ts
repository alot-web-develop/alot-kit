import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadConfig, type TAlotConfig } from "./config.js";
import { templatesRoot } from "./manifest.js";
import {
  applyPlan,
  describePlan,
  planGeneration,
  type TGenerateOptions,
} from "./render.js";
import { resolveInside } from "./safePath.js";
import { buildSnippets, listManifests } from "./snippets.js";

interface TCliIo {
  cwd: string;
  out: (line: string) => void;
  err: (line: string) => void;
  templates?: string;
}

const HELP = `alot-gen: generate files from the alot kit templates

Usage:
  alot-gen <kind> <Name> [--feature <f>] [--entity <E>] [--plural <P>]
                         [--parent <Entity>] [--variant <v>] [--persist] [--dry-run] [--force]
  alot-gen list
  alot-gen snippets [--dry-run] [--force]
  alot-gen api-contracts --input <OpenAPI file or URL> [--output <path>] [--check] [--force]
  alot-gen help

Reads ./alot.config.json. Never overwrites existing files without --force.`;

const VALUE_FLAGS = [
  "feature",
  "entity",
  "plural",
  "variant",
  "parent",
] as const;
const BOOLEAN_FLAGS = ["persist", "dry-run", "force"] as const;

interface TParsed {
  positionals: string[];
  values: Record<string, string>;
  booleans: Set<string>;
}

const parseArgs = (argv: string[]): TParsed => {
  const parsed: TParsed = { positionals: [], values: {}, booleans: new Set() };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? "";
    if (!arg.startsWith("--")) {
      parsed.positionals.push(arg);
      continue;
    }
    const [flag = "", inline] = arg.slice(2).split(/=(.*)/s);
    const name = flag === "persisted" ? "persist" : flag;
    if (VALUE_FLAGS.some((f) => f === name)) {
      const value = inline ?? argv[++i];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`--${name} requires a value`);
      }
      parsed.values[name] = value;
    } else if (BOOLEAN_FLAGS.some((f) => f === name)) {
      if (inline !== undefined) throw new Error(`--${name} takes no value`);
      parsed.booleans.add(name);
    } else {
      throw new Error(`unknown flag --${flag}`);
    }
  }
  return parsed;
};

const runList = (config: TAlotConfig, io: TCliIo): void => {
  io.out(
    "api-contracts OpenAPI types and named schema aliases (--input <file or URL>)",
  );
  for (const manifest of listManifests(
    config,
    io.templates ?? templatesRoot(),
  )) {
    const needs = [
      manifest.requiresFeature ? "--feature" : "",
      manifest.requiresEntity ? "--entity" : "",
    ].filter(Boolean);
    const parent = manifest.files.some((file) => file.flag === "parent")
      ? " [--parent <Entity>]"
      : "";
    const suffix =
      (needs.length ? ` (requires ${needs.join(", ")})` : "") + parent;
    io.out(`${manifest.kind.padEnd(14)}${manifest.description}${suffix}`);
  }
};

const runSnippets = (
  config: TAlotConfig,
  parsed: TParsed,
  io: TCliIo,
): void => {
  const dest = ".vscode/alot.code-snippets";
  const snippets = buildSnippets(config, io.templates ?? templatesRoot());
  const abs = resolveInside(io.cwd, dest);
  const dryRun = parsed.booleans.has("dry-run");
  if (existsSync(abs) && !parsed.booleans.has("force")) {
    io.out(`skip (exists) ${dest}`);
    return;
  }
  if (!dryRun) {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, `${JSON.stringify(snippets, null, 2)}\n`);
  }
  io.out(
    `${dryRun ? "would create" : "created"} ${dest} (${Object.keys(snippets).length} snippets)`,
  );
};

const runGenerate = (
  config: TAlotConfig,
  parsed: TParsed,
  io: TCliIo,
): void => {
  const [kind, name, extra] = parsed.positionals;
  if (!kind || !name) throw new Error("usage: alot-gen <kind> <Name> [flags]");
  if (extra !== undefined) throw new Error(`unexpected argument "${extra}"`);
  const options: TGenerateOptions = {
    kind,
    name,
    feature: parsed.values.feature,
    entity: parsed.values.entity,
    plural: parsed.values.plural,
    parent: parsed.values.parent,
    variant: parsed.values.variant,
    persist: parsed.booleans.has("persist"),
    force: parsed.booleans.has("force"),
  };
  const plan = planGeneration(io.cwd, config, options, io.templates);
  const dryRun = parsed.booleans.has("dry-run");
  if (!dryRun) applyPlan(plan);
  for (const line of describePlan(plan, dryRun)) io.out(line);
};

const runCli = (argv: string[], io: TCliIo): number => {
  try {
    const first = argv[0];
    if (
      first === undefined ||
      first === "help" ||
      first === "--help" ||
      first === "-h"
    ) {
      io.out(HELP);
      return 0;
    }
    const parsed = parseArgs(argv);
    const config = loadConfig(io.cwd);
    const [command] = parsed.positionals;
    if (command === "list" && parsed.positionals.length === 1) {
      runList(config, io);
    } else if (command === "snippets" && parsed.positionals.length === 1) {
      runSnippets(config, parsed, io);
    } else {
      runGenerate(config, parsed, io);
    }
    return 0;
  } catch (error) {
    io.err(
      `alot-gen: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
};

export type { TCliIo };
export { parseArgs, runCli };

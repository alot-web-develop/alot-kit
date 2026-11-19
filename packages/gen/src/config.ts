import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isFramework,
  isRecord,
  isRole,
  type TFramework,
  type TRole,
} from "./manifest.js";

interface TAlotConfig {
  framework: TFramework;
  role: TRole;
  db?: string;
  schema?: string;
  modules?: string[];
  identity?: { name: string; title: string };
  paths: Record<string, string>;
}

const FRONTEND_PATHS = {
  src: "src",
  lib: "src/lib",
  config: "src/config",
  features: "src/features",
  api: "src/api",
  utils: "src/utils",
  primitives: "src/components/ui",
};

const DEFAULT_PATHS: Record<TFramework, Record<string, string>> = {
  react: {
    ...FRONTEND_PATHS,
    app: "src/app",
    routes: "src/routes",
    locales: "src/locales",
  },
  "react-native": { ...FRONTEND_PATHS, routes: "app" },
  svelte: { ...FRONTEND_PATHS, routes: "src/routes" },
  fastify: {
    src: "src",
    config: "src/config",
    lib: "src/lib",
    plugins: "src/plugins",
    hooks: "src/hooks",
    routes: "src/routes",
    schemas: "src/schemas",
    services: "src/services",
    models: "src/models",
    jobs: "src/jobs",
    tests: "test",
  },
};

const DB_VALUES = ["mongodb-native", "mongoose"];
const MODULE_VALUES = ["mobile", "uploads"];

const parseModules = (raw: unknown): string[] => {
  if (raw === undefined) return [...MODULE_VALUES];
  const expected = `"modules" must be an array of ${MODULE_VALUES.join(", ")}`;
  if (!Array.isArray(raw)) throw new Error(`alot.config.json: ${expected}`);
  const modules: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string" || !MODULE_VALUES.includes(value)) {
      throw new Error(
        `alot.config.json: ${expected} (unknown: ${String(value)})`,
      );
    }
    if (!modules.includes(value)) modules.push(value);
  }
  return modules;
};

const parseConfig = (raw: unknown): TAlotConfig => {
  if (!isRecord(raw)) throw new Error("alot.config.json must be an object");
  const { framework } = raw;
  if (!isFramework(framework)) {
    throw new Error(
      `alot.config.json: "framework" must be one of react, react-native, svelte, fastify`,
    );
  }
  const defaultRole: TRole = framework === "fastify" ? "api" : "app";
  const role = raw.role === undefined ? defaultRole : raw.role;
  if (!isRole(role)) {
    throw new Error(`alot.config.json: "role" must be app, ui-lib or api`);
  }
  const paths: Record<string, string> = { ...DEFAULT_PATHS[framework] };
  if (raw.paths !== undefined) {
    if (!isRecord(raw.paths)) {
      throw new Error(`alot.config.json: "paths" must be an object`);
    }
    for (const [key, value] of Object.entries(raw.paths)) {
      if (typeof value !== "string") {
        throw new Error(`alot.config.json: paths.${key} must be a string`);
      }
      paths[key] = value;
    }
  }
  const config: TAlotConfig = { framework, role, paths };
  if (raw.identity !== undefined) {
    if (
      !isRecord(raw.identity) ||
      typeof raw.identity.name !== "string" ||
      !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(raw.identity.name) ||
      typeof raw.identity.title !== "string" ||
      !/^[\p{L}\p{N} .,:()+-]{1,80}$/u.test(raw.identity.title)
    ) {
      throw new Error(
        "alot.config.json: identity requires a kebab-case name and a safe display title",
      );
    }
    config.identity = { name: raw.identity.name, title: raw.identity.title };
  }
  if (framework === "fastify") {
    const db = raw.db === undefined ? "mongodb-native" : raw.db;
    if (typeof db !== "string" || !DB_VALUES.includes(db)) {
      throw new Error(
        `alot.config.json: "db" must be mongodb-native or mongoose`,
      );
    }
    const schema = raw.schema === undefined ? "zod" : raw.schema;
    if (schema !== "zod") {
      throw new Error(
        `alot.config.json: schema "${String(schema)}" is not supported, only zod`,
      );
    }
    config.db = db;
    config.schema = schema;
    config.modules = parseModules(raw.modules);
  }
  return config;
};

const loadConfig = (cwd: string): TAlotConfig => {
  let text: string;
  try {
    text = readFileSync(join(cwd, "alot.config.json"), "utf8");
  } catch {
    throw new Error(`alot.config.json not found in ${cwd}`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("alot.config.json is not valid JSON");
  }
  return parseConfig(raw);
};

export type { TAlotConfig };

const identityTokens = (config: TAlotConfig): Record<string, string> => ({
  "__app-title__": config.identity?.title ?? "App",
  "__app-slug__": config.identity?.name ?? "app",
});

export { identityTokens, loadConfig, parseConfig };

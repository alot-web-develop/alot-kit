import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FRAMEWORKS = ["react", "react-native", "svelte", "fastify"] as const;
const ROLES = ["app", "ui-lib", "api"] as const;
const KIND_PATTERN = /^[a-z][a-z0-9-]*$/;

type TFramework = (typeof FRAMEWORKS)[number];
type TRole = (typeof ROLES)[number];
type TWhen = Record<string, string>;

interface TFileSpec {
  src: string;
  dest: string;
  snippet: boolean;
  variant?: string;
  flag?: string;
  unlessFlag?: string;
  when?: TWhen;
}

interface TWireSpec {
  file: string;
  import: string;
  after: string;
  line: string;
  when?: TWhen;
}

interface TManifest {
  kind: string;
  framework: string;
  description: string;
  prefix: string;
  scope: string;
  requiresFeature: boolean;
  requiresEntity: boolean;
  role: string[];
  files: TFileSpec[];
  wire: TWireSpec[];
  next: string[];
  persistedFiles?: TFileSpec[];
  dir: string;
}

type TRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is TRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFramework = (value: unknown): value is TFramework =>
  FRAMEWORKS.some((framework) => framework === value);

const isRole = (value: unknown): value is TRole =>
  ROLES.some((role) => role === value);

const packageRoot = (): string =>
  resolve(dirname(fileURLToPath(import.meta.url)), "..");

const templatesRoot = (): string => join(packageRoot(), "templates");

const str = (record: TRecord, key: string, source: string): string => {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`${source}: "${key}" must be a string`);
  }
  return value;
};

const optStr = (
  record: TRecord,
  key: string,
  source: string,
): string | undefined =>
  record[key] === undefined ? undefined : str(record, key, source);

const strList = (record: TRecord, key: string, source: string): string[] => {
  const value = record[key];
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new Error(`${source}: "${key}" must be a string array`);
  }
  return value.map(String);
};

const parseWhen = (record: TRecord, source: string): TWhen | undefined => {
  const raw = record.when;
  if (raw === undefined) return undefined;
  if (!isRecord(raw)) throw new Error(`${source}: "when" must be an object`);
  const when: TWhen = {};
  for (const key of Object.keys(raw)) when[key] = str(raw, key, source);
  return when;
};

const parseFile = (raw: unknown, source: string): TFileSpec => {
  if (!isRecord(raw))
    throw new Error(`${source}: file entry must be an object`);
  return {
    src: str(raw, "src", source),
    dest: str(raw, "dest", source),
    snippet: raw.snippet === true,
    variant: optStr(raw, "variant", source),
    flag: optStr(raw, "flag", source),
    unlessFlag: optStr(raw, "unlessFlag", source),
    when: parseWhen(raw, source),
  };
};

const parseFiles = (raw: unknown, source: string): TFileSpec[] => {
  if (!Array.isArray(raw))
    throw new Error(`${source}: "files" must be an array`);
  return raw.map((entry) => parseFile(entry, source));
};

const parseWire = (raw: unknown, source: string): TWireSpec => {
  if (!isRecord(raw))
    throw new Error(`${source}: wire entry must be an object`);
  return {
    file: str(raw, "file", source),
    import: str(raw, "import", source),
    after: str(raw, "after", source),
    line: str(raw, "line", source),
    when: parseWhen(raw, source),
  };
};

const parseManifest = (
  raw: unknown,
  dir: string,
  source: string,
): TManifest => {
  if (!isRecord(raw)) throw new Error(`${source}: manifest must be an object`);
  const wire = raw.wire;
  if (wire !== undefined && !Array.isArray(wire)) {
    throw new Error(`${source}: "wire" must be an array`);
  }
  const variants = raw.variants;
  let persistedFiles: TFileSpec[] | undefined;
  if (isRecord(variants) && isRecord(variants.persisted)) {
    persistedFiles = parseFiles(variants.persisted.files, source);
  }
  return {
    kind: str(raw, "kind", source),
    framework: str(raw, "framework", source),
    description: str(raw, "description", source),
    prefix: str(raw, "prefix", source),
    scope: str(raw, "scope", source),
    requiresFeature: raw.requiresFeature === true,
    requiresEntity: raw.requiresEntity === true,
    role: strList(raw, "role", source),
    files: parseFiles(raw.files, source),
    wire: (wire ?? []).map((entry: unknown) => parseWire(entry, source)),
    next: strList(raw, "next", source),
    persistedFiles,
    dir,
  };
};

const loadManifest = (
  framework: TFramework,
  kind: string,
  root: string = templatesRoot(),
): TManifest => {
  if (!KIND_PATTERN.test(kind)) {
    throw new Error(`unknown kind "${kind}"`);
  }
  const dir = join(root, framework, kind);
  const file = join(dir, "template.json");
  if (!existsSync(file)) {
    throw new Error(`unknown kind "${kind}" for framework ${framework}`);
  }
  const manifest = parseManifest(
    JSON.parse(readFileSync(file, "utf8")),
    dir,
    `${framework}/${kind}`,
  );
  if (manifest.framework !== framework || manifest.kind !== kind) {
    throw new Error(`${framework}/${kind}: manifest framework/kind mismatch`);
  }
  return manifest;
};

export type { TFileSpec, TFramework, TManifest, TRole, TWhen, TWireSpec };
export {
  FRAMEWORKS,
  isFramework,
  isRecord,
  isRole,
  loadManifest,
  packageRoot,
  ROLES,
  templatesRoot,
};

import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { renderConditions } from "./conditions.js";
import { identityTokens, type TAlotConfig } from "./config.js";
import { sortNamedImports } from "./imports.js";
import {
  loadManifest,
  type TFileSpec,
  type TManifest,
  type TWhen,
  templatesRoot,
} from "./manifest.js";
import { buildTokens, normalizeName, type TNameInput } from "./names.js";
import { resolveInside } from "./safePath.js";

interface TGenerateOptions {
  kind: string;
  name: string;
  feature?: string;
  entity?: string;
  plural?: string;
  parent?: string;
  variant?: string;
  persist?: boolean;
  force?: boolean;
}

type TFileStatus = "create" | "overwrite" | "skip";
type TWireStatus = "wire" | "skip" | "todo";

interface TPlannedFile {
  dest: string;
  status: TFileStatus;
}

interface TPlannedWire {
  file: string;
  status: TWireStatus;
  hint: string;
}

interface TPlan {
  files: TPlannedFile[];
  wires: TPlannedWire[];
  writes: Map<string, string>;
}

const TOKEN_PATTERN =
  /__(?:Names?|names?|NAME|feature|Entity|entity|Parent|parent|parents|app-title|app-slug)(?:-kebab)?__/g;
const DEFAULT_VARIANT = "default";

const matchesWhen = (config: TAlotConfig, when?: TWhen): boolean => {
  if (!when) return true;
  const values: Record<string, string | undefined> = {
    db: config.db,
    schema: config.schema,
  };
  for (const module of ["mobile", "uploads"]) {
    values[module] = (config.modules ?? ["mobile", "uploads"]).includes(module)
      ? "on"
      : "off";
  }
  return Object.entries(when).every(([key, value]) => values[key] === value);
};

const expand = (text: string, tokens: Record<string, string>): string =>
  text.replace(TOKEN_PATTERN, (token) => tokens[token] ?? token);

const assertExpanded = (text: string, where: string): void => {
  const left = text.match(TOKEN_PATTERN);
  if (left) {
    const hint = left.some((token) => /feature/.test(token))
      ? " (pass --feature)"
      : left.some((token) => /ntity|entity/.test(token))
        ? " (pass --entity)"
        : "";
    throw new Error(`unexpanded placeholder ${left[0]} in ${where}${hint}`);
  }
};

const expandPath = (
  template: string,
  config: TAlotConfig,
  feature: string | undefined,
): string => {
  const withPaths = template.replace(/\{paths\.(\w+)\}/g, (_, key: string) => {
    const value = config.paths[key];
    if (value === undefined) throw new Error(`unknown path key "${key}"`);
    return value.replace(/\/+$/, "");
  });
  if (withPaths.includes("{feature}")) {
    if (feature === undefined)
      throw new Error("destination requires --feature");
    return withPaths.replaceAll("{feature}", feature);
  }
  return withPaths;
};

const supportsFlag = (manifest: TManifest, flag: string): boolean =>
  (flag === "persist" && manifest.persistedFiles !== undefined) ||
  manifest.files.some((f) => f.flag === flag || f.unlessFlag === flag);

const knownVariants = (manifest: TManifest): string[] => [
  DEFAULT_VARIANT,
  ...manifest.files.flatMap((f) => (f.variant ? [f.variant] : [])),
];

const selectFiles = (
  manifest: TManifest,
  config: TAlotConfig,
  variant: string,
  persist: boolean,
  parent = false,
): TFileSpec[] => {
  const flags: Record<string, boolean> = { persist, parent };
  const source =
    persist && manifest.persistedFiles
      ? manifest.persistedFiles
      : manifest.files;
  return source.filter(
    (f) =>
      (!f.variant || f.variant === variant) &&
      (!f.flag || flags[f.flag] === true) &&
      (!f.unlessFlag || flags[f.unlessFlag] !== true) &&
      matchesWhen(config, f.when),
  );
};

const validateOptions = (
  manifest: TManifest,
  config: TAlotConfig,
  options: TGenerateOptions,
): void => {
  if (!manifest.role.includes(config.role)) {
    throw new Error(
      `kind "${manifest.kind}" is not available for role "${config.role}" (allowed: ${manifest.role.join(", ")})`,
    );
  }
  if (manifest.requiresFeature && !options.feature) {
    throw new Error(`kind "${manifest.kind}" requires --feature`);
  }
  if (manifest.requiresEntity && !options.entity) {
    throw new Error(`kind "${manifest.kind}" requires --entity`);
  }
  if (options.persist && !supportsFlag(manifest, "persist")) {
    throw new Error(`kind "${manifest.kind}" does not support --persist`);
  }
  if (options.parent !== undefined && !supportsFlag(manifest, "parent")) {
    throw new Error(`kind "${manifest.kind}" does not support --parent`);
  }
  if (
    options.variant !== undefined &&
    !knownVariants(manifest).includes(options.variant)
  ) {
    throw new Error(
      `unknown variant "${options.variant}" for kind "${manifest.kind}" (known: ${knownVariants(manifest).join(", ")})`,
    );
  }
};

const readTemplate = (manifest: TManifest, src: string): string => {
  const frameworkDir = resolve(manifest.dir, "..");
  const file = resolve(manifest.dir, src);
  if (!file.startsWith(frameworkDir + sep)) {
    throw new Error(`template source "${src}" is outside the templates`);
  }
  return readFileSync(file, "utf8");
};

const insertLine = (
  source: string,
  anchorEnd: number,
  line: string,
): string => {
  if (source[anchorEnd] !== "\n") {
    return `${source.slice(0, anchorEnd)}\n${line}\n${source.slice(anchorEnd)}`;
  }
  let pos = anchorEnd;
  for (;;) {
    const next = source.indexOf("\n", pos + 1);
    if (next === -1 || /^\s*[}\]]/.test(source.slice(pos + 1, next))) break;
    pos = next;
  }
  return `${source.slice(0, pos)}\n${line}${source.slice(pos)}`;
};

const insertImport = (source: string, statement: string): string => {
  const imports = [...source.matchAll(/^import .*;$/gm)];
  const last = imports.at(-1);
  if (!last) return `${statement}\n${source}`;
  const pos = last.index + last[0].length;
  return `${source.slice(0, pos)}\n${statement}${source.slice(pos)}`;
};

const planGeneration = (
  root: string,
  config: TAlotConfig,
  options: TGenerateOptions,
  templates: string = templatesRoot(),
): TPlan => {
  const manifest = loadManifest(config.framework, options.kind, templates);
  validateOptions(manifest, config, options);
  const nameInput: TNameInput = {
    name: normalizeName(options.kind, options.name),
    plural: options.plural,
    feature: options.feature,
    entity: options.entity,
    parent: options.parent,
  };
  const tokens = { ...buildTokens(nameInput), ...identityTokens(config) };
  const feature = tokens.__feature__;
  const variant = options.variant ?? DEFAULT_VARIANT;
  const specs = selectFiles(
    manifest,
    config,
    variant,
    options.persist === true,
    options.parent !== undefined,
  );
  const plan: TPlan = { files: [], wires: [], writes: new Map() };
  const seen = new Set<string>();

  const lastWord = options.name.split(/(?=[A-Z])|[-_]/).at(-1) ?? "";
  if (
    !options.plural &&
    /s$/i.test(lastWord) &&
    !/(ss|us|is|ics|news)$/i.test(lastWord) &&
    specs.some((spec) =>
      /__(?:Names|names)(?:-kebab)?__/.test(readTemplate(manifest, spec.src)),
    )
  ) {
    throw new Error(
      `ambiguous plural name "${options.name}": use the singular base name or supply --plural explicitly`,
    );
  }

  for (const spec of specs) {
    const dest = expand(expandPath(spec.dest, config, feature), tokens);
    assertExpanded(dest, `destination ${spec.dest}`);
    if (seen.has(dest)) throw new Error(`duplicate destination "${dest}"`);
    seen.add(dest);
    const abs = resolveInside(root, dest);
    const expanded = expand(
      renderConditions(readTemplate(manifest, spec.src), config),
      tokens,
    );
    const content = sortNamedImports(expanded, dest);
    assertExpanded(content, dest);
    const present = existsSync(abs);
    if (present && statSync(abs).isDirectory()) {
      throw new Error(`destination "${dest}" is a directory`);
    }
    if (present && !options.force) {
      plan.files.push({ dest, status: "skip" });
      continue;
    }
    plan.files.push({ dest, status: present ? "overwrite" : "create" });
    plan.writes.set(abs, content);
  }

  for (const wire of manifest.wire.filter((w) => matchesWhen(config, w.when))) {
    const rel = expand(expandPath(wire.file, config, feature), tokens);
    const line = expand(wire.line, tokens);
    const statement = expand(wire.import, tokens);
    assertExpanded(`${rel}\n${line}\n${statement}`, "wire entry");
    const abs = resolveInside(root, rel);
    const hint = `wire ${rel}: add\n  ${statement}\n  ${line.trim()}  (after "${wire.after}")`;
    const current =
      plan.writes.get(abs) ??
      (existsSync(abs) ? readFileSync(abs, "utf8") : undefined);
    if (current === undefined) {
      plan.wires.push({ file: rel, status: "todo", hint });
      continue;
    }
    const lineDone = current.includes(line.trim());
    const importDone = current.includes(statement);
    if (lineDone && importDone) {
      plan.wires.push({ file: rel, status: "skip", hint });
      continue;
    }
    let next = current;
    if (!lineDone) {
      const at = next.indexOf(wire.after);
      if (at === -1) {
        plan.wires.push({ file: rel, status: "todo", hint });
        continue;
      }
      next = insertLine(next, at + wire.after.length, line);
    }
    if (!importDone) next = insertImport(next, statement);
    plan.writes.set(abs, next);
    plan.wires.push({ file: rel, status: "wire", hint });
  }
  return plan;
};

const applyPlan = (plan: TPlan): void => {
  for (const [abs, content] of plan.writes) {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
};

const describePlan = (plan: TPlan, dryRun: boolean): string[] => {
  const lines: string[] = [];
  const fileVerb: Record<TFileStatus, string> = dryRun
    ? {
        create: "would create",
        overwrite: "would overwrite",
        skip: "skip (exists)",
      }
    : { create: "created", overwrite: "overwritten", skip: "skip (exists)" };
  for (const file of plan.files) {
    lines.push(`${fileVerb[file.status]} ${file.dest}`);
  }
  for (const wire of plan.wires) {
    if (wire.status === "todo") lines.push(`todo ${wire.hint}`);
    else if (wire.status === "skip") lines.push(`skip (wired) ${wire.file}`);
    else lines.push(`${dryRun ? "would wire" : "wired"} ${wire.file}`);
  }
  return lines;
};

export type { TGenerateOptions, TPlan };
export { applyPlan, describePlan, matchesWhen, planGeneration, selectFiles };

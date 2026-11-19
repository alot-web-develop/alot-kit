import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderConditions } from "./conditions.js";
import { identityTokens, type TAlotConfig } from "./config.js";
import { loadManifest, type TManifest } from "./manifest.js";
import { matchesWhen, selectFiles } from "./render.js";

interface TSnippet {
  prefix: string;
  scope: string;
  body: string[];
  description: string;
}

const FILENAME_BASE = "$".concat("{TM_FILENAME_BASE}");
const KEBAB = (n: number): string =>
  `\${${n}/(^[A-Z])|([A-Z])|([^A-Z])/\${1:/downcase}\${2:+-}\${2:/downcase}\${3}/g}`;
const SNAKE_UPPER = (n: number): string =>
  `\${${n}/(^[A-Z])|([A-Z])|([^A-Z])/\${1:/upcase}\${2:+_}\${2:/upcase}\${3:/upcase}/g}`;
const CAMEL = (n: number): string => `\${${n}/(^.)(.*)/\${1:/downcase}$2/}`;

const TOKEN_PATTERN =
  /__(?:Names?|names?|NAME|feature|Entity|entity)(?:-kebab)?__/g;

const escapeLiteral = (text: string): string =>
  text.replace(/[\\$}]/g, (c) => `\\${c}`);

const toSnippetBody = (source: string): string[] => {
  const declared = new Set<number>();
  const stop = (n: number, fallback: string): string => {
    if (declared.has(n)) return `$${n}`;
    declared.add(n);
    return `\${${n}:${fallback}}`;
  };
  const render = (token: string): string => {
    switch (token) {
      case "__Name__":
        return stop(1, FILENAME_BASE);
      case "__name__":
        return CAMEL(1);
      case "__name-kebab__":
        return KEBAB(1);
      case "__NAME__":
        return SNAKE_UPPER(1);
      case "__feature__":
        return stop(2, "feature");
      case "__Names__":
        return stop(3, "Names");
      case "__names__":
        return CAMEL(3);
      case "__names-kebab__":
        return KEBAB(3);
      case "__Entity__":
        return stop(4, "Entity");
      default:
        return CAMEL(4);
    }
  };
  let out = "";
  let last = 0;
  for (const match of source.matchAll(TOKEN_PATTERN)) {
    out += escapeLiteral(source.slice(last, match.index)) + render(match[0]);
    last = match.index + match[0].length;
  }
  out += escapeLiteral(source.slice(last));
  return out.replace(/\n$/, "").split("\n");
};

const listManifests = (config: TAlotConfig, templates: string): TManifest[] => {
  const frameworkDir = join(templates, config.framework);
  return readdirSync(frameworkDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => loadManifest(config.framework, entry.name, templates))
    .filter((manifest) => manifest.role.includes(config.role))
    .sort((a, b) => a.kind.localeCompare(b.kind));
};

const buildSnippets = (
  config: TAlotConfig,
  templates: string,
): Record<string, TSnippet> => {
  const snippets: Record<string, TSnippet> = {};
  const add = (
    manifest: TManifest,
    suffix: string,
    src: string,
    index: number,
  ): void => {
    const prefix = [manifest.prefix, suffix].filter(Boolean).join("-");
    const key = index === 0 ? prefix : `${prefix}-${index + 1}`;
    snippets[key] = {
      prefix: key,
      scope: manifest.scope,
      description: manifest.description,
      body: toSnippetBody(
        Object.entries(identityTokens(config)).reduce(
          (source, [token, value]) => source.replaceAll(token, value),
          renderConditions(
            readFileSync(join(manifest.dir, src), "utf8"),
            config,
          ),
        ),
      ),
    };
  };
  for (const manifest of listManifests(config, templates)) {
    const variants = new Set(
      manifest.files.flatMap((f) => (f.variant ? [f.variant] : [])),
    );
    const buckets: { suffix: string; variant: string; persist: boolean }[] = [
      { suffix: "", variant: "default", persist: false },
      ...[...variants]
        .filter((v) => v !== "default")
        .map((v) => ({ suffix: v, variant: v, persist: false })),
    ];
    const hasPersist =
      manifest.persistedFiles !== undefined ||
      manifest.files.some((f) => f.flag === "persist");
    if (hasPersist) {
      buckets.push({ suffix: "persist", variant: "default", persist: true });
    }
    for (const bucket of buckets) {
      const files = selectFiles(
        manifest,
        config,
        bucket.variant,
        bucket.persist,
      ).filter((f) => f.snippet && matchesWhen(config, f.when));
      for (const [index, file] of files.entries()) {
        add(manifest, bucket.suffix, file.src, index);
      }
    }
  }
  return snippets;
};

export type { TSnippet };
export { buildSnippets, listManifests, toSnippetBody };

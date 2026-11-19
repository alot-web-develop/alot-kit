import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const persisted = args.includes("--persisted");
const [
  templatesRoot,
  outRoot,
  framework,
  kind,
  rawName,
  feature = "",
  entity = "",
  pluralArg = "",
] = args.filter((arg) => arg !== "--persisted");
const config = {
  paths: {
    src: "src",
    routes: "src/routes",
    lib: "src/lib",
    config: "src/config",
    features: "src/features",
    api: "src/api",
    utils: "src/utils",
    primitives: "src/components/ui",
  },
};

const words = rawName
  .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  .split(/[\s_-]+/)
  .filter(Boolean);
const pascal = words
  .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
  .join("");
const pluralize = (w) =>
  /[^aeiou]y$/i.test(w)
    ? `${w.slice(0, -1)}ies`
    : /(s|x|z|ch|sh)$/i.test(w)
      ? `${w}es`
      : `${w}s`;
const pluralWords = pluralArg
  ? pluralArg
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .split(/[\s_-]+/)
      .filter(Boolean)
  : [...words.slice(0, -1), pluralize(words.at(-1))];
const pluralPascal = pluralWords
  .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
  .join("");
const vars = {
  __Names__: pluralPascal,
  __names__: pluralPascal[0].toLowerCase() + pluralPascal.slice(1),
  "__names-kebab__": pluralWords.map((w) => w.toLowerCase()).join("-"),
  __Name__: pascal,
  __name__: pascal[0].toLowerCase() + pascal.slice(1),
  "__name-kebab__": words.map((w) => w.toLowerCase()).join("-"),
  __NAME__: words.map((w) => w.toUpperCase()).join("_"),
  __feature__: feature,
  __Entity__: entity,
  __entity__: entity ? entity[0].toLowerCase() + entity.slice(1) : "",
};
const fill = (s) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(k, v), s);

const dir = join(templatesRoot, framework, kind);
const manifest = JSON.parse(readFileSync(join(dir, "template.json"), "utf8"));
if (manifest.requiresFeature && !feature)
  throw new Error(`${kind} requires --feature`);
if (manifest.requiresEntity && !entity)
  throw new Error(`${kind} requires --entity`);

const files = persisted ? manifest.variants?.persisted?.files : manifest.files;
if (!files) throw new Error(`${kind} has no persisted variant`);
for (const file of files) {
  const dest = fill(
    file.dest
      .replace(/\{paths\.(\w+)\}/g, (_, k) => config.paths[k])
      .replaceAll("{feature}", feature),
  );
  const target = join(outRoot, dest);
  if (existsSync(target)) {
    console.log(`skip (exists) ${dest}`);
    continue;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, fill(readFileSync(join(dir, file.src), "utf8")));
  console.log(`created ${dest}`);
}

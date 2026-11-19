import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const argv = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2)));
const [templatesRoot, outRoot, framework, kind, rawName, feature = '', entity = '', pluralArg = ''] = argv;
const config = { paths: { features: 'src/features', api: 'src/api', utils: 'src/utils', primitives: 'src/components/ui', src: 'src', lib: 'src/lib', config: 'src/config', routes: 'app' } };

const words = rawName.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[\s_-]+/).filter(Boolean);
const pascal = words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
const pluralize = (w) => (/[^aeiou]y$/i.test(w) ? w.slice(0, -1) + 'ies' : /(s|x|z|ch|sh)$/i.test(w) ? w + 'es' : w + 's');
const pluralWords = pluralArg
  ? pluralArg.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[\s_-]+/).filter(Boolean)
  : [...words.slice(0, -1), pluralize(words.at(-1))];
const pluralPascal = pluralWords.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
const vars = {
  __Names__: pluralPascal,
  __names__: pluralPascal[0].toLowerCase() + pluralPascal.slice(1),
  '__names-kebab__': pluralWords.map((w) => w.toLowerCase()).join('-'),
  __Name__: pascal,
  __name__: pascal[0].toLowerCase() + pascal.slice(1),
  '__name-kebab__': words.map((w) => w.toLowerCase()).join('-'),
  __NAME__: words.map((w) => w.toUpperCase()).join('_'),
  __feature__: feature,
  __Entity__: entity,
  __entity__: entity ? entity[0].toLowerCase() + entity.slice(1) : '',
};
const fill = (s) => Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(k, v), s);

const dir = join(templatesRoot, framework, kind);
const manifest = JSON.parse(readFileSync(join(dir, 'template.json'), 'utf8'));
if (manifest.requiresFeature && !feature) throw new Error(`${kind} requires --feature`);
if (manifest.requiresEntity && !entity) throw new Error(`${kind} requires --entity`);

for (const file of manifest.files) {
  if (file.flag && !flags.has(file.flag)) continue;
  if (file.unlessFlag && flags.has(file.unlessFlag)) continue;
  const dest = fill(file.dest.replace(/\{paths\.(\w+)\}/g, (_, k) => config.paths[k]).replaceAll('{feature}', feature));
  const target = join(outRoot, dest);
  if (existsSync(target)) { console.log(`skip (exists) ${dest}`); continue; }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, fill(readFileSync(join(dir, file.src), 'utf8')));
  console.log(`created ${dest}`);
}

for (const wire of manifest.wire ?? []) {
  const rel = fill(wire.file.replace(/\{paths\.(\w+)\}/g, (_, k) => config.paths[k]).replaceAll('{feature}', feature));
  const target = join(outRoot, rel);
  const line = fill(wire.line);
  const imp = fill(wire.import);
  if (!existsSync(target)) { console.log(`todo wire ${rel}: ${imp} / ${line.trim()}`); continue; }
  let src = readFileSync(target, 'utf8');
  if (src.includes(line.trim())) { console.log(`skip (wired) ${rel}`); continue; }
  const at = src.indexOf(wire.after);
  if (at === -1) { console.log(`todo wire ${rel}: anchor "${wire.after}" not found`); continue; }
  let pos = at + wire.after.length;
  for (;;) {
    const next = src.indexOf('\n', pos + 1);
    if (next === -1 || /^\s*[}\]]/.test(src.slice(pos + 1, next))) break;
    pos = next;
  }
  src = `${src.slice(0, pos)}\n${line}${src.slice(pos)}`;
  const last = [...src.matchAll(/^import .*;$/gm)].at(-1);
  src = last ? `${src.slice(0, last.index + last[0].length)}\n${imp}${src.slice(last.index + last[0].length)}` : `${imp}\n\n${src}`;
  writeFileSync(target, src);
  console.log(`wired ${rel}`);
}

const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
const FEATURE_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;
const ENTITY_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

interface TNameInput {
  name: string;
  plural?: string;
  feature?: string;
  entity?: string;
  parent?: string;
}

const normalizeName = (kind: string, name: string): string => {
  if (kind !== "hook" && kind !== "form") return name;
  const normalized = buildTokens({ name }).__Name__ ?? name;
  return kind === "hook"
    ? normalized.replace(/^Use(?=[A-Z])/, "")
    : normalized.replace(/(?<=.)Form$/, "");
};

const splitWords = (value: string): string[] =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean);

const capitalize = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

const lowerFirst = (value: string): string =>
  value.charAt(0).toLowerCase() + value.slice(1);

const pluralizeWord = (word: string): string => {
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  return `${word}s`;
};

const assertPattern = (
  value: string,
  pattern: RegExp,
  label: string,
  hint: string,
): void => {
  if (!pattern.test(value)) {
    throw new Error(`invalid ${label} "${value}": ${hint}`);
  }
};

const buildTokens = (input: TNameInput): Record<string, string> => {
  assertPattern(
    input.name,
    NAME_PATTERN,
    "name",
    "use letters, digits, '-' or '_', starting with a letter",
  );
  const words = splitWords(input.name);
  if (input.plural !== undefined) {
    assertPattern(
      input.plural,
      NAME_PATTERN,
      "--plural",
      "use letters, digits, '-' or '_', starting with a letter",
    );
  }
  const pluralWords = input.plural
    ? splitWords(input.plural)
    : [...words.slice(0, -1), pluralizeWord(words.at(-1) ?? "")];
  const pascal = words.map(capitalize).join("");
  const pluralPascal = pluralWords.map(capitalize).join("");
  const tokens: Record<string, string> = {
    __Name__: pascal,
    __name__: lowerFirst(pascal),
    "__name-kebab__": words.map((w) => w.toLowerCase()).join("-"),
    __NAME__: words.map((w) => w.toUpperCase()).join("_"),
    __Names__: pluralPascal,
    __names__: lowerFirst(pluralPascal),
    "__names-kebab__": pluralWords.map((w) => w.toLowerCase()).join("-"),
  };
  if (input.feature !== undefined) {
    assertPattern(
      input.feature,
      FEATURE_PATTERN,
      "--feature",
      "use a camelCase identifier",
    );
    tokens.__feature__ = lowerFirst(input.feature);
  }
  if (input.entity !== undefined) {
    assertPattern(
      input.entity,
      ENTITY_PATTERN,
      "--entity",
      "use a PascalCase identifier",
    );
    tokens.__Entity__ = input.entity;
    tokens.__entity__ = lowerFirst(input.entity);
  }
  if (input.parent !== undefined) {
    assertPattern(
      input.parent,
      ENTITY_PATTERN,
      "--parent",
      "use a PascalCase identifier",
    );
    const parent = buildTokens({ name: input.parent });
    tokens.__Parent__ = parent.__Name__ ?? "";
    tokens.__parent__ = parent.__name__ ?? "";
    tokens["__parents-kebab__"] = parent["__names-kebab__"] ?? "";
  }
  return tokens;
};

export type { TNameInput };
export {
  buildTokens,
  capitalize,
  lowerFirst,
  normalizeName,
  pluralizeWord,
  splitWords,
};

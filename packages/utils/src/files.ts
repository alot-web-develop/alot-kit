import {
  isNonNegativeSafeInteger,
  isNullOrUndefined,
  isScalar,
} from "./guards.js";

export { formatBytes } from "./format.js";

export type FileMetadata = Readonly<{
  name: string;
  size: number;
  type: string;
}>;
export type FileRules = {
  accept?: string | readonly string[];
  minSize?: number;
  maxSize?: number;
};
export type FileIssue = {
  code:
    | "invalid_size"
    | "too_small"
    | "too_large"
    | "invalid_type"
    | "too_many";
  fileIndex?: number;
  limit?: number;
};
export type FileValidation = { valid: boolean; issues: FileIssue[] };

/**
 * Extracts the lowercase file extension (without the dot) from a name or path.
 *
 * @param name - Filename or path.
 * @returns The extension, or an empty string when none is present.
 */
export function getFileExtension(name: string): string {
  const filename = name.split(/[/\\]/).at(-1) ?? "";
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

function acceptTokens(accept: string | readonly string[]): string[] {
  const tokens = (
    typeof accept === "string"
      ? accept.split(",")
      : accept.flatMap((item) => item.split(","))
  )
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (
    tokens.some(
      (token) =>
        !/^(?:\.[^\s,./\\]+(?:\.[^\s,./\\]+)*|[\w!#$&^.+-]+\/(?:[\w!#$&^.+-]+|\*))$/.test(
          token,
        ),
    )
  ) {
    throw new RangeError("Invalid accept token");
  }
  return tokens;
}

function matchesTokens(
  file: Pick<FileMetadata, "name" | "type">,
  tokens: readonly string[],
): boolean {
  const mime = file.type.toLowerCase().split(";")[0].trim();
  const name = file.name.toLowerCase();
  return (
    tokens.length === 0 ||
    tokens.some((token) => {
      if (token.startsWith(".")) return name.endsWith(token);
      if (token.endsWith("/*"))
        return (
          mime.startsWith(token.slice(0, -1)) && mime.length > token.length - 1
        );
      return mime === token;
    })
  );
}

/** HTML accept-style alternatives. MIME is never guessed from an extension. */
/**
 * Tests a file's name and MIME type against HTML accept-style tokens.
 *
 * @param file - File with `name` and `type`.
 * @param accept - Comma-separated string or array of accept tokens.
 * @returns `true` when no tokens restrict the file, or one matches.
 */
export function matchesFileAccept(
  file: Pick<FileMetadata, "name" | "type">,
  accept: string | readonly string[],
): boolean {
  return matchesTokens(file, acceptTokens(accept));
}

function validateLimit(value: number | undefined, name: string): void {
  if (value !== undefined && !isNonNegativeSafeInteger(value)) {
    throw new RangeError(`${name} must be a nonnegative safe integer`);
  }
}

function validateRules(rules: FileRules): string[] {
  validateLimit(rules.minSize, "minSize");
  validateLimit(rules.maxSize, "maxSize");
  if (
    rules.minSize !== undefined &&
    rules.maxSize !== undefined &&
    rules.minSize > rules.maxSize
  ) {
    throw new RangeError("minSize exceeds maxSize");
  }
  return acceptTokens(rules.accept ?? "");
}

function fileIssues(
  file: FileMetadata,
  rules: FileRules,
  tokens: readonly string[],
): FileIssue[] {
  const issues: FileIssue[] = [];
  if (!isNonNegativeSafeInteger(file.size))
    issues.push({ code: "invalid_size" });
  else {
    if (rules.minSize !== undefined && file.size < rules.minSize)
      issues.push({ code: "too_small", limit: rules.minSize });
    if (rules.maxSize !== undefined && file.size > rules.maxSize)
      issues.push({ code: "too_large", limit: rules.maxSize });
  }
  if (!matchesTokens(file, tokens)) issues.push({ code: "invalid_type" });
  return issues;
}

/**
 * Validates a single file against size and accept rules.
 *
 * @param file - The file to validate.
 * @param rules - Accept, min, and max size constraints.
 * @returns A validation result with any issues encountered.
 */
export function validateFile(
  file: FileMetadata,
  rules: FileRules = {},
): FileValidation {
  const issues = fileIssues(file, rules, validateRules(rules));
  return { valid: issues.length === 0, issues };
}

/**
 * Validates multiple files, adding a `too_many` issue when `maxFiles` is
 * exceeded. Per-file issues carry their zero-based `fileIndex`.
 *
 * @param files - The files to validate.
 * @param rules - Accept, size, and optional `maxFiles` constraints.
 * @returns A validation result with any issues encountered.
 */
export function validateFiles(
  files: Iterable<FileMetadata>,
  rules: FileRules & { maxFiles?: number } = {},
): FileValidation {
  const tokens = validateRules(rules);
  validateLimit(rules.maxFiles, "maxFiles");
  const items = Array.from(files);
  const issues: FileIssue[] = [];
  if (rules.maxFiles !== undefined && items.length > rules.maxFiles)
    issues.push({ code: "too_many", limit: rules.maxFiles });
  items.forEach((file, fileIndex) => {
    issues.push(
      ...fileIssues(file, rules, tokens).map((issue) => ({
        ...issue,
        fileIndex,
      })),
    );
  });
  return { valid: issues.length === 0, issues };
}

export type FormDataScalar =
  | string
  | number
  | boolean
  | Blob
  | null
  | undefined;
export type FormDataValue = FormDataScalar | readonly FormDataScalar[];

/**
 * Converts a flat record into a `FormData` instance. Arrays repeat the field;
 * nullish values are skipped; Blob/File values retain their filename.
 *
 * @param values - Flat key/value record to serialize.
 * @returns The populated `FormData`.
 */
export function toFormData(
  values: Readonly<Record<string, FormDataValue>>,
): FormData {
  const result = new FormData();
  const appendField = (key: string, item: FormDataScalar): void => {
    const isBlob = typeof Blob !== "undefined" && item instanceof Blob;
    if (isBlob) {
      result.append(key, item);
      return;
    }
    if (!isScalar(item)) {
      throw new TypeError(
        "FormData values must be scalars, Blob/File or arrays of these",
      );
    }
    if (typeof item === "number" && !Number.isFinite(item)) {
      throw new RangeError("Expected a finite FormData number");
    }
    result.append(key, String(item));
  };

  for (const [key, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (isNullOrUndefined(item)) continue;
      appendField(key, item);
    }
  }
  return result;
}

/**
 * Creates an object URL for a Blob, returning a revoke function for cleanup.
 * Throws when object URLs are unavailable in the current runtime.
 *
 * @param file - The Blob to preview.
 * @returns The object URL and an idempotent `revoke` function.
 */
export function createFilePreview(file: Blob): {
  url: string;
  revoke: () => void;
} {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function")
    throw new Error("Object URLs are unavailable in this runtime");
  const url = URL.createObjectURL(file);
  let revoked = false;
  return {
    url,
    revoke() {
      if (!revoked) {
        URL.revokeObjectURL(url);
        revoked = true;
      }
    },
  };
}

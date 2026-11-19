import { z } from "zod";

/** Parses a comma-separated string into an array of trimmed, non-empty items. */
const csvSchema = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGINS: csvSchema,
});

type TEnvSource = Record<string, string | undefined>;
type TEnvKey<T extends z.ZodObject> = Extract<keyof z.input<T>, string>;
type TLoadEnvOptions<T extends z.ZodObject> = {
  groups?: ReadonlyArray<ReadonlyArray<TEnvKey<T>>>;
  requiredInProduction?: ReadonlyArray<TEnvKey<T>>;
  source?: TEnvSource;
};

const isSet = (source: TEnvSource, key: string) => Boolean(source[key]?.trim());

/** A key counts as provided when set in the source and not blank. */
const isEmptyValue = (value: unknown): boolean => {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim() === "";
  return false;
};

/** Detects partially configured key groups within a source. */
function validateGroups(
  source: TEnvSource,
  groups: ReadonlyArray<ReadonlyArray<string>>,
): string[] {
  const problems: string[] = [];
  for (const group of groups) {
    const configured = group.filter((key) => isSet(source, key));
    const isPartial = configured.length > 0 && configured.length < group.length;
    if (isPartial) {
      problems.push(`${group.join(", ")} must be set together`);
    }
  }
  return problems;
}

/** Detects production-required keys that are missing or empty. */
function validateProduction(
  source: TEnvSource,
  requiredInProduction: ReadonlyArray<string>,
  parsed: Record<string, unknown> | undefined,
): string[] {
  const isProduction =
    source.NODE_ENV === "production" || parsed?.NODE_ENV === "production";
  if (!isProduction) return [];

  const missing = requiredInProduction.filter((key) => {
    if (!isSet(source, key)) return true;
    if (parsed === undefined) return false;
    // A nonblank CSV source such as ", ," can still produce an empty allowlist.
    return isEmptyValue(parsed[key]);
  });
  if (missing.length === 0) return [];
  return [`required in production: ${missing.join(", ")}`];
}

/**
 * Loads and validates environment variables against a Zod schema, enforcing
 * repository-specific rules on top of plain schema parsing:
 *
 * - Keys listed in a `groups` entry must be set together or not at all.
 * - Keys in `requiredInProduction` must be non-empty when `NODE_ENV` is
 *   `production`.
 *
 * Throws a single aggregated {@link Error} describing every violation.
 *
 * @param schema - Zod schema describing the expected environment shape.
 * @param options - Group and production-requirement configuration.
 * @returns The parsed (and defaulted) environment object.
 */
const loadEnv = <T extends z.ZodObject>(
  schema: T,
  options: TLoadEnvOptions<T> = {},
): z.infer<T> => {
  const {
    groups = [],
    requiredInProduction = [],
    source = process.env,
  } = options;
  const problems: string[] = [];

  problems.push(...validateGroups(source, groups));

  const result = schema.safeParse(source);
  const parsed = result.success
    ? (result.data as Record<string, unknown>)
    : undefined;
  problems.push(...validateProduction(source, requiredInProduction, parsed));

  if (!result.success) {
    // Schema messages (including custom refinements) may contain secret values.
    problems.push(
      ...result.error.issues.map(
        (issue) => `${issue.path.join(".")}: invalid value (${issue.code})`,
      ),
    );
  }
  if (problems.length > 0 || !result.success) {
    throw new Error(`Invalid environment:\n- ${problems.join("\n- ")}`);
  }
  return result.data;
};

export type { TEnvKey, TEnvSource, TLoadEnvOptions };
export { baseEnvSchema, csvSchema, loadEnv };

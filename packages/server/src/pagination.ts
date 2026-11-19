import { z } from "zod";

const PAGINATION_DEFAULT_LIMIT = 20;
const PAGINATION_MAX_LIMIT = 100;

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_MAX_LIMIT)
    .default(PAGINATION_DEFAULT_LIMIT),
});

type TPaginationQuery = { page?: number; limit?: number };
type TPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
type TPaginated<T> = { items: T[] } & TPagination;

/** Clamps a raw limit into `[1, PAGINATION_MAX_LIMIT]`, defaulting when non-finite. */
const normalizeLimit = (limit: number | undefined): number => {
  if (limit === undefined || !Number.isFinite(limit)) {
    return PAGINATION_DEFAULT_LIMIT;
  }
  return Math.min(PAGINATION_MAX_LIMIT, Math.max(1, Math.trunc(limit)));
};

/** Clamps a raw page into `[1, floor(MAX_SAFE_INTEGER / limit)]`, defaulting when non-finite. */
const normalizePage = (page: number | undefined, limit: number): number => {
  if (page === undefined || !Number.isFinite(page)) return 1;
  return Math.min(
    Math.floor(Number.MAX_SAFE_INTEGER / limit),
    Math.max(1, Math.trunc(page)),
  );
};

/**
 * Clamps and normalizes page/limit inputs into safe, inclusive bounds.
 *
 * `limit` is coerced to an integer in `[1, PAGINATION_MAX_LIMIT]` and `page`
 * to a positive integer whose product with `limit` stays below
 * `Number.MAX_SAFE_INTEGER`. Non-finite inputs fall back to defaults.
 *
 * @param query - Raw page/limit values (both optional).
 * @returns Normalized `page`, `limit`, and the derived zero-based `skip`.
 */
const parsePagination = ({ page, limit }: TPaginationQuery) => {
  const safeLimit = normalizeLimit(limit);
  const safePage = normalizePage(page, safeLimit);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

/**
 * Wraps a page of `items` with normalized pagination metadata.
 *
 * @param items - The current page's items.
 * @param total - Total number of items across all pages.
 * @param query - Raw page/limit values passed through {@link parsePagination}.
 * @returns The paginated result including `totalPages`.
 */
const paginated = <T>(
  items: T[],
  total: number,
  query: TPaginationQuery,
): TPaginated<T> => {
  const { page, limit } = parsePagination(query);
  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
};

/**
 * Returns a Zod schema matching the {@link paginated} result shape.
 *
 * @param item - Schema describing each item in `items`.
 * @returns A schema for the full paginated envelope.
 */
const paginatedSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export type { TPaginated, TPagination, TPaginationQuery };
export {
  objectIdSchema,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
  paginated,
  paginatedSchema,
  paginationQuerySchema,
  parsePagination,
};

import type { T__Name__ListQuery } from '@/types/main-api-types';

const positiveInteger = (value: string | null, fallback: number, max: number) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
};

const read__Name__Filters = (params: URLSearchParams) => ({
  page: positiveInteger(params.get('page'), 1, Number.MAX_SAFE_INTEGER),
  limit: positiveInteger(params.get('limit'), 20, 100),
  search: params.get('search')?.trim() ?? '',
} satisfies T__Name__ListQuery);

export { read__Name__Filters };

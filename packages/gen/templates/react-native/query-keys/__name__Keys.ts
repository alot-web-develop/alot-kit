import type { T__Name__ListQuery } from '@/types/main-api-types';

const __name__Keys = {
  all: ['__names-kebab__'] as const,
  lists: () => [...__name__Keys.all, 'list'] as const,
  list: (query?: T__Name__ListQuery) => [...__name__Keys.lists(), query ?? {}] as const,
  details: () => [...__name__Keys.all, 'detail'] as const,
  detail: (id: string) => [...__name__Keys.details(), id] as const,
};

export { __name__Keys };

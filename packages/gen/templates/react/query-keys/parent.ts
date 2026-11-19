import type { T__Name__ListQuery } from '@/types/main-api-types';

const __name__Keys = {
  all: ['__names-kebab__'] as const,
  lists: () => [...__name__Keys.all, 'list'] as const,
  scope: (__parent__Id: string) => [...__name__Keys.lists(), __parent__Id] as const,
  list: (__parent__Id: string, query?: T__Name__ListQuery) => [...__name__Keys.scope(__parent__Id), query ?? {}] as const,
  details: () => [...__name__Keys.all, 'detail'] as const,
  detail: (id: string) => [...__name__Keys.details(), id] as const,
};

export { __name__Keys };

import { api } from '@/api/client';
import type {
  TCreate__Name__Request,
  TUpdate__Name__Request,
  T__Name__,
  T__Name__ListQuery,
  T__Name__ListResponse,
} from '@/types/main-api-types';

const BASE = '/__names-kebab__';

const list__Names__ = (query?: T__Name__ListQuery) => api.get<T__Name__ListResponse>(BASE, { query });

const get__Name__ = (id: string) => api.get<T__Name__>(`${BASE}/${id}`);

const create__Name__ = (body: TCreate__Name__Request) => api.post<T__Name__>(BASE, { body });

const update__Name__ = (id: string, body: TUpdate__Name__Request) => api.patch<T__Name__>(`${BASE}/${id}`, { body });

const delete__Name__ = (id: string) => api.delete<void>(`${BASE}/${id}`);

export { list__Names__, get__Name__, create__Name__, update__Name__, delete__Name__ };

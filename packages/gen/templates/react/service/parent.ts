import { api } from '@/api/client';
import type {
  TCreate__Name__Request,
  T__Name__,
  T__Name__ListQuery,
  T__Name__ListResponse,
  TUpdate__Name__Request,
} from '@/types/main-api-types';

const BASE = '/__names-kebab__';
const collectionPath = (__parent__Id: string) => `/__parents-kebab__/${encodeURIComponent(__parent__Id)}${BASE}`;

const list__Names__ = (__parent__Id: string, query?: T__Name__ListQuery) =>
  api.get<T__Name__ListResponse>(collectionPath(__parent__Id), { query });

const get__Name__ = (id: string) => api.get<T__Name__>(`${BASE}/${encodeURIComponent(id)}`);

const create__Name__ = (__parent__Id: string, body: TCreate__Name__Request) =>
  api.post<T__Name__>(collectionPath(__parent__Id), { body });

const update__Name__ = (id: string, body: TUpdate__Name__Request) =>
  api.patch<T__Name__>(`${BASE}/${encodeURIComponent(id)}`, { body });

const delete__Name__ = (id: string) => api.delete<void>(`${BASE}/${encodeURIComponent(id)}`);

export { create__Name__, delete__Name__, get__Name__, list__Names__, update__Name__ };

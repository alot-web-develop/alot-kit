import { api } from '@/api/client';
import type {
  TCreateOrderRequest,
  TUpdateOrderRequest,
  TOrder,
  TOrderListQuery,
  TOrderListResponse,
} from '@/types/main-api-types';

const BASE = '/orders';

const listOrders = (query?: TOrderListQuery) => api.get<TOrderListResponse>(BASE, { query });

const getOrder = (id: string) => api.get<TOrder>(`${BASE}/${id}`);

const createOrder = (body: TCreateOrderRequest) => api.post<TOrder>(BASE, { body });

const updateOrder = (id: string, body: TUpdateOrderRequest) => api.patch<TOrder>(`${BASE}/${id}`, { body });

const deleteOrder = (id: string) => api.delete<void>(`${BASE}/${id}`);

export { listOrders, getOrder, createOrder, updateOrder, deleteOrder };

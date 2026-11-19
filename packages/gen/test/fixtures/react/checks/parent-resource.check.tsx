// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { orderItemKeys } from '@/api/keys/orderItemKeys';
import { createOrderItem, getOrderItem, listOrderItems } from '@/api/services/orderItem';
import { useCreateOrderItem } from '@/api/mutations/useCreateOrderItem';
import { useListOrderItems } from '@/api/queries/useListOrderItems';

vi.mock('@/lib/auth', () => ({ getToken: () => undefined, signOut: vi.fn() }));
vi.mock('@/config/env', () => ({ env: { apiUrl: 'http://api.test/api' } }));

afterEach(() => vi.unstubAllGlobals());

const response = () => Response.json({ success: true, data: { id: 'one', name: 'One', createdAt: '' } });

test('generated service scopes collection requests and encodes path segments with the real fetcher', async () => {
  const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response());
  vi.stubGlobal('fetch', fetch);
  await listOrderItems('a/b', { page: 2 });
  await createOrderItem('a/b', { name: 'One' });
  await getOrderItem('item/id');
  expect(String(fetch.mock.calls[0]?.[0])).toBe('http://api.test/api/orders/a%2Fb/order-items?page=2');
  expect(String(fetch.mock.calls[1]?.[0])).toBe('http://api.test/api/orders/a%2Fb/order-items');
  expect(String(fetch.mock.calls[2]?.[0])).toBe('http://api.test/api/order-items/item%2Fid');
});

test('parent list keys isolate cached data and creation invalidates every filter of its parent only', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => response()));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrap = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const a = orderItemKeys.list('a', { page: 2 });
  const b = orderItemKeys.list('b', { page: 2 });
  client.setQueryData(a, { items: [], total: 0 });
  client.setQueryData(b, { items: [], total: 0 });
  const { result, unmount } = renderHook(() => useCreateOrderItem('a'), { wrapper: wrap });
  await act(async () => { await result.current.mutateAsync({ name: 'One' }); });
  expect(client.getQueryState(a)?.isInvalidated).toBe(true);
  expect(client.getQueryState(b)?.isInvalidated).toBe(false);
  unmount();
  client.clear();
});

test('list hook does not request an absent parent', async () => {
  const fetch = vi.fn(async () => response());
  vi.stubGlobal('fetch', fetch);
  const client = new QueryClient();
  const wrap = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, unmount } = renderHook(() => useListOrderItems(''), { wrapper: wrap });
  await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
  expect(fetch).not.toHaveBeenCalled();
  unmount();
  client.clear();
});

test('switching parent reloads its collection and retains separate cached results', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const parent = new URL(String(input)).pathname.split('/')[3];
    return Response.json({ success: true, data: { items: [{ id: parent, name: parent, createdAt: '' }], total: 1 } });
  }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrap = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result, rerender, unmount } = renderHook(({ parent }) => useListOrderItems(parent), { initialProps: { parent: 'a' }, wrapper: wrap });
  await waitFor(() => expect(result.current.data?.items[0]?.id).toBe('a'));
  rerender({ parent: 'b' });
  await waitFor(() => expect(result.current.data?.items[0]?.id).toBe('b'));
  expect(client.getQueryData(orderItemKeys.list('a'))).toMatchObject({ items: [{ id: 'a' }] });
  unmount();
  client.clear();
});

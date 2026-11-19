import { afterEach, expect, test, vi } from 'vitest';
import { ApiError } from '@alot-web-develop/api';
import { toast } from 'sonner';
import { queryClient } from '@/lib/queryClient';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

afterEach(() => { queryClient.clear(); vi.clearAllMocks(); });

test('does not retry 4xx responses and bounds network retries', () => {
  const retry = queryClient.getDefaultOptions().queries?.retry;
  if (typeof retry !== 'function') throw new Error('Expected a retry policy');
  for (const status of [400, 401, 403, 404, 429, 499]) {
    expect(retry(0, new ApiError({ title: 'Client error', message: 'Client error', status }))).toBe(false);
  }
  expect(retry(0, new ApiError({ title: 'Unavailable', message: 'Unavailable', status: 503 }))).toBe(true);
  expect(retry(0, new Error('Offline'))).toBe(true);
  expect(retry(3, new Error('Offline'))).toBe(false);
});

test('keeps cached data and reports background refetch failures', async () => {
  queryClient.setQueryData(['orders'], [{ id: 'one' }]);
  await expect(queryClient.fetchQuery({ queryKey: ['orders'], staleTime: 0, retry: false, queryFn: async () => { throw new Error('Offline'); } })).rejects.toThrow('Offline');
  expect(queryClient.getQueryData(['orders'])).toEqual([{ id: 'one' }]);
  expect(toast.error).toHaveBeenCalledWith('Offline');
});

test('reports mutation failures globally', async () => {
  const mutation = queryClient.getMutationCache().build(queryClient, { mutationFn: async () => { throw new Error('Write failed'); } });
  await expect(mutation.execute(undefined)).rejects.toThrow('Write failed');
  expect(toast.error).toHaveBeenCalledWith('Write failed');
});

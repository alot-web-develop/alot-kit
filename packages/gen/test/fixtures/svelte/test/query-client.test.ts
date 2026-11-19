import { expect, test, vi } from 'vitest';
import { ApiError } from '@alot-web-develop/api';
import { toast } from 'svelte-sonner';
import { createQueryClient, shouldRetry } from '@/lib/queryClient';

vi.mock('svelte-sonner', () => ({ toast: { error: vi.fn() } }));

test('skips all 4xx errors and caps transient retries', () => {
  for (const status of [400, 401, 403, 404, 429, 499]) {
    expect(shouldRetry(0, { status })).toBe(false);
    expect(shouldRetry(0, new ApiError({ title: 'Failure', message: 'Failure', status }))).toBe(false);
  }
  expect(shouldRetry(0, { status: 503 })).toBe(true);
  expect(shouldRetry(1, new Error('Network'))).toBe(true);
  expect(shouldRetry(2, new Error('Network'))).toBe(false);
});

test('isolates clients and reports query and mutation errors globally', async () => {
  const client = createQueryClient();
  const other = createQueryClient();
  const queryFn = vi.fn(() => { throw new ApiError({ title: 'Missing', message: 'Query failed', status: 404 }); });
  await expect(client.fetchQuery({ queryKey: ['missing'], queryFn })).rejects.toThrow('Query failed');
  expect(queryFn).toHaveBeenCalledTimes(1);
  expect(toast.error).toHaveBeenCalledWith('Query failed');
  const mutation = client.getMutationCache().build(client, { mutationFn: async () => { throw new Error('Mutation failed'); } });
  await expect(mutation.execute(undefined)).rejects.toThrow('Mutation failed');
  expect(toast.error).toHaveBeenCalledWith('Mutation failed');
  expect(other.getQueryCache().getAll()).toHaveLength(0);
  client.clear();
  other.clear();
});

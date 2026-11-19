import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { PreferencesStore } from '@/features/orders/stores/preferencesStore.svelte';
import { OrderStore } from '@/features/orders/stores/orderStore.svelte';

vi.mock('svelte', async () => ({ ...await vi.importActual<typeof import('svelte')>('svelte'), onMount: (fn: () => void) => fn() }));
const storage = new Map<string, string>();
beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
  });
});
afterEach(() => { vi.unstubAllGlobals(); });

test('persists methods and direct assignments and restores typed state', () => {
  const store = new PreferencesStore();
  store.open();
  expect(new PreferencesStore().isOpen).toBe(true);
  store.isOpen = false;
  expect(new PreferencesStore().isOpen).toBe(false);
  expect(storage.get('preferences')).toBe('{"isOpen":false}');
});

test('ignores corrupt and wrongly typed persistence and unavailable storage', () => {
  for (const value of ['{', 'null', '{"isOpen":"true"}']) {
    storage.set('preferences', value);
    expect(new PreferencesStore().isOpen).toBe(false);
  }
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Disabled'); }, setItem: () => { throw new Error('Disabled'); } });
  expect(() => new PreferencesStore().open()).not.toThrow();
});

test('keeps ordinary stores isolated without persistence', () => {
  const first = new OrderStore();
  const second = new OrderStore();
  first.open();
  expect(first.isOpen).toBe(true);
  expect(second.isOpen).toBe(false);
  expect(storage.size).toBe(0);
});

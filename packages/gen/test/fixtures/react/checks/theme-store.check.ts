import { afterEach, expect, test, vi } from 'vitest';
import { applyTheme, readStoredTheme, storeTheme } from '@/lib/theme/theme';

const values = new Map<string, string>();
const localStorage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
afterEach(() => { values.clear(); vi.unstubAllGlobals(); });

test('persists theme selection and applies the resolved dark theme', () => {
  vi.stubGlobal('localStorage', localStorage);
  const toggle = vi.fn();
  vi.stubGlobal('document', { documentElement: { classList: { toggle } } });
  expect(readStoredTheme('system')).toBe('system');
  storeTheme('dark');
  expect(readStoredTheme('system')).toBe('dark');
  localStorage.setItem('theme', 'invalid');
  expect(readStoredTheme('system')).toBe('system');
  applyTheme('dark');
  expect(toggle).toHaveBeenLastCalledWith('dark', true);
  applyTheme('light');
  expect(toggle).toHaveBeenLastCalledWith('dark', false);
});

test('rehydrates only the selection in the persisted store', async () => {
  vi.stubGlobal('localStorage', localStorage);
  const { useOrderPreferencesStore } = await import('@/features/orders/stores/useOrderPreferencesStore');
  useOrderPreferencesStore.getState().toggle('one');
  expect(values.get('orders.order-preferences')).toBe(JSON.stringify({ state: { selectedIds: ['one'] }, version: 1 }));
  useOrderPreferencesStore.setState({ selectedIds: [] });
  localStorage.setItem('orders.order-preferences', JSON.stringify({ state: { selectedIds: ['saved'] }, version: 1 }));
  await useOrderPreferencesStore.persist.rehydrate();
  expect(useOrderPreferencesStore.getState().selectedIds).toEqual(['saved']);
  expect(typeof useOrderPreferencesStore.getState().toggle).toBe('function');
});

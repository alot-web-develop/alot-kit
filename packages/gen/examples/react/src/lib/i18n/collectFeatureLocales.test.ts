import { describe, expect, it } from 'vitest';
import { collectFeatureLocales } from './collectFeatureLocales';

describe('collectFeatureLocales', () => {
  const modules = {
    '../../features/orders/locales/it.ts': { locale: { title: 'Ordini' } },
    '../../features/orders/locales/en.ts': { locale: { title: 'Orders' } },
    '../../features/auth/locales/en.ts': { locale: { title: 'Sign in' } },
  };

  it('groups the locales of one language by feature', () => {
    expect(collectFeatureLocales(modules, 'en')).toEqual({
      orders: { title: 'Orders' },
      auth: { title: 'Sign in' },
    });
  });

  it('ignores paths outside feature locales', () => {
    expect(collectFeatureLocales({ '../../locales/en.ts': { locale: {} } }, 'en')).toEqual({});
  });
});

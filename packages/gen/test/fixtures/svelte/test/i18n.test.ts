import { expect, test } from 'vitest';
import { I18n } from '@/lib/i18n.svelte';

test('registers feature locales and keeps locale state per provider', () => {
  const english = new I18n();
  const italian = new I18n();
  italian.setLocale('it');
  expect(english.t('save')).toBe('Save');
  expect(italian.t('save')).toBe('Salva');
  expect(italian.translate('orders', 'name')).toBe('Nome');
  expect(english.translate('orders', 'name')).toBe('Name');
});

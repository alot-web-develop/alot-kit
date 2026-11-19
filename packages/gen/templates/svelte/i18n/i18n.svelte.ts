import { getContext, setContext } from 'svelte';
import { en } from '@/locales/en';
import { it } from '@/locales/it';

type Locale = 'en' | 'it';
type TranslationKey = keyof typeof en;
type Messages = Record<string, string>;
interface FeatureLocale { namespace: string; en: Messages; it: Messages }
const features = import.meta.glob<FeatureLocale>('../features/*/locales/index.ts', { eager: true });
const resources: Record<Locale, Record<string, Messages>> = { en: { common: en }, it: { common: it } };
for (const feature of Object.values(features)) {
  resources.en[feature.namespace] = feature.en;
  resources.it[feature.namespace] = feature.it;
}

class I18n {
  locale = $state<Locale>('en');
  t(key: TranslationKey): string { return this.translate('common', key); }
  translate(namespace: string, key: string): string {
    return resources[this.locale][namespace]?.[key] ?? resources.en[namespace]?.[key] ?? `${namespace}.${key}`;
  }
  setLocale(locale: Locale) { this.locale = locale; }
}

const i18nKey = Symbol('i18n');
const provideI18n = (value: I18n) => setContext(i18nKey, value);
const useI18n = (): I18n => {
  const value = getContext<I18n | undefined>(i18nKey);
  if (!value) throw new Error('I18nProvider is missing');
  return value;
};

export { I18n, provideI18n, useI18n };
export type { Locale, TranslationKey };

import type { locale as common } from '@/locales/it';

interface TranslationResources {
  common: typeof common;
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: TranslationResources };
  }
}

export type { TranslationResources };

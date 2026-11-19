import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from '@/locales/en';
import { it } from '@/locales/it';

const FALLBACK_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = ['en', 'it'] as const;

const resources = {
  en: { translation: en },
  it: { translation: it },
} as const;

const deviceLanguage = getLocales()[0]?.languageCode ?? FALLBACK_LANGUAGE;
const language = SUPPORTED_LANGUAGES.find((supported) => supported === deviceLanguage) ?? FALLBACK_LANGUAGE;

void i18n.use(initReactI18next).init({
  resources,
  lng: language,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
});

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}

export { i18n };

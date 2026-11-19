import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { locale as commonEn } from '@/locales/en';
import { locale as commonIt } from '@/locales/it';
import { collectFeatureLocales, type TLocaleModule } from './collectFeatureLocales';
import './resources';

const SUPPORTED_LANGUAGES = ['it', 'en'] as const;
const DEFAULT_LANGUAGE = 'it';

const featureLocales = import.meta.glob<TLocaleModule>('../../features/*/locales/*.ts', { eager: true });

void i18n.use(initReactI18next).init({
  resources: {
    it: { translation: { common: commonIt, ...collectFeatureLocales(featureLocales, 'it') } },
    en: { translation: { common: commonEn, ...collectFeatureLocales(featureLocales, 'en') } },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
});

export { i18n, SUPPORTED_LANGUAGES };

import { useI18n } from '@/lib/i18n.svelte';
import { en } from './en';
import { it } from './it';

const namespace = '__feature__';
type FeatureTranslationKey = keyof typeof en;
const useFeatureTranslations = () => {
  const i18n = useI18n();
  return { t: (key: FeatureTranslationKey) => i18n.translate(namespace, key) };
};

export { namespace, en, it, useFeatureTranslations };
export type { FeatureTranslationKey };

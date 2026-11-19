type TLocaleModule = { locale: object };

const LOCALE_PATH = /features\/([^/]+)\/locales\/([^/.]+)\.ts$/;

const collectFeatureLocales = (modules: Record<string, TLocaleModule>, language: string) => {
  const entries = Object.entries(modules).flatMap(([path, { locale }]) => {
    const [, feature, fileLanguage] = path.match(LOCALE_PATH) ?? [];

    return feature && fileLanguage === language ? [[feature, locale] as const] : [];
  });

  return Object.fromEntries(entries);
};

export { collectFeatureLocales };
export type { TLocaleModule };

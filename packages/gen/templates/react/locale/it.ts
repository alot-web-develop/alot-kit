const locale = {
  title: '__Names__',
  form: {
    name: 'Nome',
  },
  list: {
    search: 'Cerca',
    columns: {
      name: 'Nome',
      createdAt: 'Creato il',
    },
  },
};

declare module '@/lib/i18n/resources' {
  interface TranslationResources {
    __feature__: typeof locale;
  }
}

export { locale };

const locale = {
  title: 'Orders',
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
    orders: typeof locale;
  }
}

export { locale };

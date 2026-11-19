const locale = {
  login: {
    title: 'Accedi',
    email: 'Email',
    password: 'Password',
    submit: 'Accedi',
  },
};

declare module '@/lib/i18n/resources' {
  interface TranslationResources {
    auth: typeof locale;
  }
}

export { locale };

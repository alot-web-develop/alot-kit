import type { en } from './en';

const features = {
};

const it: typeof en = {
  ...features,
  common: {
    save: 'Salva',
    cancel: 'Annulla',
    retry: 'Riprova',
    previous: 'Precedente',
    next: 'Successivo',
    home: 'Home',
    email: 'Email',
    password: 'Password',
    signIn: 'Accedi',
    signOut: 'Esci',
  },
};

export { it };

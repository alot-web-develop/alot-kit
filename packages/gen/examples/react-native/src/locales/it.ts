import type { en } from './en';
import { ordersIt } from '@/features/orders/locales/it';

const features = {
  orders: ordersIt,
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

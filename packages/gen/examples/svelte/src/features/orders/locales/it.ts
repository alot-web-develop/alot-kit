import type { en } from './en';

const it = { title: 'Orders', name: 'Nome' } satisfies Record<keyof typeof en, string>;

export { it };

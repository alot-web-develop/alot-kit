import { create } from 'zustand';

interface T__Name__Store {
  selectedId: string | null;
  select: (id: string) => void;
  clear: () => void;
}

const use__Name__Store = create<T__Name__Store>()((set) => ({
  selectedId: null,
  select: (id) => set({ selectedId: id }),
  clear: () => set({ selectedId: null }),
}));

export { use__Name__Store };
export type { T__Name__Store };

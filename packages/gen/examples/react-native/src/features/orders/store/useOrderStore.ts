import { create } from 'zustand';

interface TOrderStore {
  selectedId: string | null;
  select: (id: string) => void;
  clear: () => void;
}

const useOrderStore = create<TOrderStore>()((set) => ({
  selectedId: null,
  select: (id) => set({ selectedId: id }),
  clear: () => set({ selectedId: null }),
}));

export { useOrderStore };
export type { TOrderStore };

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface __Name__State {
  selectedIds: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = '__feature__.__name-kebab__';
const STORAGE_VERSION = 1;

const use__Name__Store = create<__Name__State>()(
  persist(
    (set) => ({
      selectedIds: [],
      toggle: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedIds, id],
        })),
      clear: () => set({ selectedIds: [] }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedIds: state.selectedIds }),
    },
  ),
);

export { use__Name__Store };

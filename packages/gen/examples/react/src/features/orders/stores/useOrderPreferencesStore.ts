import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OrderPreferencesState {
  selectedIds: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = 'orders.order-preferences';
const STORAGE_VERSION = 1;

const useOrderPreferencesStore = create<OrderPreferencesState>()(
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

export { useOrderPreferencesStore };

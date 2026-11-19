import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface TOrderPersistedStore {
  selectedId: string | null;
  select: (id: string) => void;
  clear: () => void;
}

const useOrderPersistedStore = create<TOrderPersistedStore>()(
  persist(
    (set) => ({
      selectedId: null,
      select: (id) => set({ selectedId: id }),
      clear: () => set({ selectedId: null }),
    }),
    {
      name: 'order-persisted',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ selectedId }) => ({ selectedId }),
    },
  ),
);

export { useOrderPersistedStore };
export type { TOrderPersistedStore };

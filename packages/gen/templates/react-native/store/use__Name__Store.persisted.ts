import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface T__Name__Store {
  selectedId: string | null;
  select: (id: string) => void;
  clear: () => void;
}

const use__Name__Store = create<T__Name__Store>()(
  persist(
    (set) => ({
      selectedId: null,
      select: (id) => set({ selectedId: id }),
      clear: () => set({ selectedId: null }),
    }),
    {
      name: '__name-kebab__',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ selectedId }) => ({ selectedId }),
    },
  ),
);

export { use__Name__Store };
export type { T__Name__Store };

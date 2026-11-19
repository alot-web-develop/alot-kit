import { create } from 'zustand';

interface __Name__State {
  selectedIds: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

const use__Name__Store = create<__Name__State>()((set) => ({
  selectedIds: [],
  toggle: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedIds, id],
    })),
  clear: () => set({ selectedIds: [] }),
}));

export { use__Name__Store };

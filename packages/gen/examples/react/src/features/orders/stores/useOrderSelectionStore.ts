import { create } from 'zustand';

interface OrderSelectionState {
  selectedIds: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

const useOrderSelectionStore = create<OrderSelectionState>()((set) => ({
  selectedIds: [],
  toggle: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedIds, id],
    })),
  clear: () => set({ selectedIds: [] }),
}));

export { useOrderSelectionStore };

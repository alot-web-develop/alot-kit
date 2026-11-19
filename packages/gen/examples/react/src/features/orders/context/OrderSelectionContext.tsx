import { createContext, type ReactNode, use, useMemo, useState } from 'react';

interface OrderSelectionContextValue {
  selectedId: string | null;
  select: (id: string | null) => void;
}

interface OrderSelectionProviderProps {
  children: ReactNode;
}

const OrderSelectionContext = createContext<OrderSelectionContextValue | null>(null);

const OrderSelectionProvider = ({ children }: OrderSelectionProviderProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const value = useMemo(() => ({ selectedId, select: setSelectedId }), [selectedId]);

  return <OrderSelectionContext value={value}>{children}</OrderSelectionContext>;
};

const useOrderSelection = () => {
  const context = use(OrderSelectionContext);
  if (!context) throw new Error('useOrderSelection must be used within OrderSelectionProvider');

  return context;
};

export { OrderSelectionProvider, useOrderSelection };

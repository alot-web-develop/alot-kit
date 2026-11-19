import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface TOrderContextValue {
  selectedId: string | null;
  select: (id: string) => void;
  clear: () => void;
}

const OrderContext = createContext<TOrderContextValue | null>(null);

interface OrderProviderProps {
  children: ReactNode;
}

const OrderProvider = ({ children }: OrderProviderProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const select = useCallback((id: string) => setSelectedId(id), []);
  const clear = useCallback(() => setSelectedId(null), []);

  const value = useMemo(() => ({ selectedId, select, clear }), [selectedId, select, clear]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrder must be used within OrderProvider');
  return context;
};

export { OrderProvider, useOrder };
export type { TOrderContextValue };

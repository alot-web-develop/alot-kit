import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface T__Name__ContextValue {
  selectedId: string | null;
  select: (id: string) => void;
  clear: () => void;
}

const __Name__Context = createContext<T__Name__ContextValue | null>(null);

interface __Name__ProviderProps {
  children: ReactNode;
}

const __Name__Provider = ({ children }: __Name__ProviderProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const select = useCallback((id: string) => setSelectedId(id), []);
  const clear = useCallback(() => setSelectedId(null), []);

  const value = useMemo(() => ({ selectedId, select, clear }), [selectedId, select, clear]);

  return <__Name__Context.Provider value={value}>{children}</__Name__Context.Provider>;
};

const use__Name__ = () => {
  const context = useContext(__Name__Context);
  if (!context) throw new Error('use__Name__ must be used within __Name__Provider');
  return context;
};

export { __Name__Provider, use__Name__ };
export type { T__Name__ContextValue };

import { createContext, type ReactNode, use, useMemo, useState } from 'react';

interface __Name__ContextValue {
  selectedId: string | null;
  select: (id: string | null) => void;
}

interface __Name__ProviderProps {
  children: ReactNode;
}

const __Name__Context = createContext<__Name__ContextValue | null>(null);

const __Name__Provider = ({ children }: __Name__ProviderProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const value = useMemo(() => ({ selectedId, select: setSelectedId }), [selectedId]);

  return <__Name__Context value={value}>{children}</__Name__Context>;
};

const use__Name__ = () => {
  const context = use(__Name__Context);
  if (!context) throw new Error('use__Name__ must be used within __Name__Provider');

  return context;
};

export { __Name__Provider, use__Name__ };

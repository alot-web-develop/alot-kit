import { getContext, setContext } from 'svelte';
const key = Symbol('__name__');
interface __Name__Context { value: string }
const provide__Name__ = (value: __Name__Context) => setContext(key, value);
const use__Name__ = (): __Name__Context => {
  const value = getContext<__Name__Context | undefined>(key);
  if (!value) throw new Error('__Name__ provider is missing');
  return value;
};
export { provide__Name__, use__Name__ };
export type { __Name__Context };

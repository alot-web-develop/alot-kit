import { getContext, setContext } from 'svelte';
const key = Symbol('order');
interface OrderContext { value: string }
const provideOrder = (value: OrderContext) => setContext(key, value);
const useOrder = (): OrderContext => {
  const value = getContext<OrderContext | undefined>(key);
  if (!value) throw new Error('Order provider is missing');
  return value;
};
export { provideOrder, useOrder };
export type { OrderContext };

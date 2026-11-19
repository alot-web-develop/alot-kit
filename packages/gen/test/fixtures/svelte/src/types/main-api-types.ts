export type TOrder = { id: string; name: string; createdAt: string };
export type TOrderListQuery = { page?: number; limit?: number; search?: string };
export type TOrderListResponse = { items: TOrder[]; total: number };
export type TCreateOrderRequest = { name: string };
export type TUpdateOrderRequest = Partial<TCreateOrderRequest>;

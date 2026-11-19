export type TOrder = { id: string; name: string; createdAt: string };
export type TOrderListQuery = { page?: number; limit?: number; search?: string };
export type TOrderListResponse = { items: TOrder[]; total: number };
export type TCreateOrderRequest = { name: string };
export type TUpdateOrderRequest = Partial<TCreateOrderRequest>;

export type TOrderItem = TOrder;
export type TOrderItemListQuery = TOrderListQuery;
export type TOrderItemListResponse = TOrderListResponse;
export type TCreateOrderItemRequest = TCreateOrderRequest;
export type TUpdateOrderItemRequest = TUpdateOrderRequest;

export type TCategory = TOrder;
export type TCategoryListQuery = TOrderListQuery;
export type TCategoryListResponse = TOrderListResponse;
export type TCreateCategoryRequest = TCreateOrderRequest;
export type TUpdateCategoryRequest = TUpdateOrderRequest;

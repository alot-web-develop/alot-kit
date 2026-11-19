import { expectTypeOf, test } from "vitest";
import type {
  ApiResult,
  DeleteResponse,
  GetQuery,
  GetResponse,
  PatchBody,
  PatchResponse,
  PostBody,
  PostResponse,
  PutBody,
  PutResponse,
  ResponseData,
} from "../src/index.js";

type Order = { id: string; name: string };
type Page = {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
type Ok<T> = { success: true; data: T };
type Fail = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};
type Json<T> = {
  headers: Record<string, unknown>;
  content: { "application/json": T };
};
type Write = { name: string };

// Same structure as openapi-typescript output: optional never methods,
// numeric status keys, optional requestBody/query, and content?: never on 204.
interface Paths {
  "/orders": {
    parameters: { query?: never; header?: never; path?: never; cookie?: never };
    get: {
      parameters: {
        query?: { page?: number; limit?: number; search?: string };
      };
      responses: { 200: Json<Ok<Page>>; 401: Json<Fail> };
    };
    post: {
      requestBody: { content: { "application/json": Write } };
      responses: { 201: Json<Ok<Order>>; 400: Json<Fail> };
    };
    put?: never;
    patch?: never;
    delete?: never;
  };
  "/orders/{id}": {
    get: { responses: { 200: Json<Order>; 404: Json<Fail> } };
    post?: never;
    put: {
      requestBody?: { content: { "application/json": Write } };
      responses: { "200": Json<Ok<Order>>; "202": Json<Ok<{ queued: true }>> };
    };
    patch: {
      requestBody: {
        content: { "application/merge-patch+json": Partial<Write> };
      };
      responses: { "2XX": Json<Ok<Order>>; default: Json<Fail> };
    };
    delete: {
      responses: { 204: { headers: Record<string, unknown>; content?: never } };
    };
  };
  "/failure": { get: { responses: { 200: Json<Ok<Order> | Fail> } } };
  "/text": {
    get: { responses: { 200: { content: { "text/plain": string } } } };
  };
  "/none": { get: { responses: { 204: { content?: never } } } };
}

test("extracts domain aliases used by generated services, retaining pagination", () => {
  expectTypeOf<GetResponse<Paths, "/orders">>().toEqualTypeOf<Page>();
  expectTypeOf<GetQuery<Paths, "/orders">>().toEqualTypeOf<{
    page?: number;
    limit?: number;
    search?: string;
  }>();
  expectTypeOf<PostBody<Paths, "/orders">>().toEqualTypeOf<Write>();
  expectTypeOf<PostResponse<Paths, "/orders">>().toEqualTypeOf<Order>();
  expectTypeOf<PutBody<Paths, "/orders/{id}">>().toEqualTypeOf<Write>();
  expectTypeOf<PutResponse<Paths, "/orders/{id}">>().toEqualTypeOf<
    Order | { queued: true }
  >();
  expectTypeOf<PatchBody<Paths, "/orders/{id}">>().toEqualTypeOf<
    Partial<Write>
  >();
  expectTypeOf<PatchResponse<Paths, "/orders/{id}">>().toEqualTypeOf<Order>();
  expectTypeOf<DeleteResponse<Paths, "/orders/{id}">>().toEqualTypeOf<void>();
});

test("handles direct JSON, failure unions, absent query, and bodyless responses", () => {
  expectTypeOf<GetResponse<Paths, "/orders/{id}">>().toEqualTypeOf<Order>();
  expectTypeOf<GetResponse<Paths, "/failure">>().toEqualTypeOf<Order>();
  expectTypeOf<GetResponse<Paths, "/none", "envelope">>().toEqualTypeOf<void>();
  expectTypeOf<GetResponse<Paths, "/text">>().toEqualTypeOf<never>();
  expectTypeOf<GetQuery<Paths, "/orders/{id}">>().toEqualTypeOf<never>();
  expectTypeOf<GetResponse<Paths, "/orders", "json">>().toEqualTypeOf<
    Ok<Page>
  >();
  expectTypeOf<
    GetResponse<Paths, "/orders/{id}", "envelope">
  >().toEqualTypeOf<never>();
  // @ts-expect-error The path does not exist.
  type MissingPath = GetResponse<Paths, "/missing">;
  // @ts-expect-error This method is explicitly absent from the generated paths.
  type MissingMethod = PostBody<Paths, "/orders/{id}">;
  // @ts-expect-error Optional never methods are not callable operations.
  type OptionalNever = PutBody<Paths, "/orders">;
  expectTypeOf<MissingPath | MissingMethod | OptionalNever>();
});

test("matches runtime envelope modes, including collisions and malformed shapes", () => {
  type Collision = Ok<Order> & { extra: string };
  type Malformed = { success: false; error: { code: number; message: string } };
  type ExtraError = {
    success: false;
    error: { code: string; message: string; extra: number };
  };
  expectTypeOf<ResponseData<Collision>>().toEqualTypeOf<Collision>();
  expectTypeOf<ResponseData<Collision, "envelope">>().toEqualTypeOf<never>();
  expectTypeOf<ResponseData<Ok<Order>, "json">>().toEqualTypeOf<Ok<Order>>();
  expectTypeOf<ResponseData<Fail, "json">>().toEqualTypeOf<Fail>();
  expectTypeOf<ResponseData<Fail>>().toEqualTypeOf<never>();
  expectTypeOf<ResponseData<Malformed>>().toEqualTypeOf<Malformed>();
  expectTypeOf<ResponseData<ExtraError>>().toEqualTypeOf<ExtraError>();
  expectTypeOf<ResponseData<ExtraError, "envelope">>().toEqualTypeOf<never>();
  expectTypeOf<ResponseData<Ok<Ok<Order>>>>().toEqualTypeOf<Ok<Order>>();
  expectTypeOf<ResponseData<null>>().toEqualTypeOf<null>();
});

test("ApiResult narrows exactly as the template fixtures require", () => {
  const consume = (result: ApiResult<Order>) => {
    if (result.error) {
      expectTypeOf(result.data).toEqualTypeOf<null>();
      expectTypeOf(result.errorDetails.title).toEqualTypeOf<string>();
    } else {
      expectTypeOf(result.data).toEqualTypeOf<Order>();
      expectTypeOf(result.errorDetails).toEqualTypeOf<null>();
    }
  };
  expectTypeOf(consume).parameter(0).toEqualTypeOf<ApiResult<Order>>();
});

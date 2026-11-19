import type { ResponseMode } from "./types.js";

type Method = "get" | "post" | "put" | "patch" | "delete";

// biome-ignore lint/suspicious/noConfusingVoidType: Generated delete services use api.delete<void>(), so response aliases must preserve void.
type EmptyResponse = void;

type PathsWithMethod<Paths, Verb extends Method> = {
  [Path in keyof Paths]: Verb extends keyof Paths[Path]
    ? [NonNullable<Paths[Path][Verb]>] extends [never]
      ? never
      : Path
    : never;
}[keyof Paths];

type Operation<
  Paths,
  Path extends keyof Paths,
  Verb extends Method,
> = NonNullable<Paths[Path][Verb & keyof Paths[Path]]>;

type JsonContent<Content> = Content[Extract<
  keyof Content,
  "application/json" | `${string}+json` | `${string}+json;${string}`
>];

/**
 * Resolves the data type of an OpenAPI response payload according to the
 * configured response mode, mirroring the runtime envelope recognition:
 * `json` preserves the complete payload, while `auto` unwraps exact
 * `{ success: true, data }` envelopes.
 */
export type ResponseData<
  Payload,
  Mode extends ResponseMode = "auto",
> = Mode extends "json"
  ? Payload
  : Payload extends { success: true; data: infer Data }
    ? Exclude<keyof Payload, "success" | "data"> extends never
      ? Data
      : Mode extends "envelope"
        ? never
        : Payload
    : Payload extends {
          success: false;
          error: infer ErrorBody extends { code: string; message: string };
        }
      ? Exclude<keyof Payload, "success" | "error"> extends never
        ? Exclude<keyof ErrorBody, "code" | "message" | "details"> extends never
          ? never
          : Mode extends "envelope"
            ? never
            : Payload
        : Mode extends "envelope"
          ? never
          : Payload
      : Mode extends "envelope"
        ? never
        : Payload;

type ResponsePayload<Response> = Response extends { content: infer Content }
  ? JsonContent<Content>
  : EmptyResponse;

type SuccessResponse<Op, Mode extends ResponseMode> = Op extends {
  responses: infer Responses;
}
  ? {
      [Status in keyof Responses]: `${Status & (number | string)}` extends `2${string}`
        ? ResponsePayload<Responses[Status]> extends infer Payload
          ? [Payload] extends [EmptyResponse]
            ? Payload
            : ResponseData<Payload, Mode>
          : never
        : never;
    }[keyof Responses]
  : never;

type Body<Op> = Op extends { requestBody?: infer RequestBody }
  ? NonNullable<RequestBody> extends { content: infer Content }
    ? JsonContent<Content>
    : never
  : never;

export type GetResponse<
  Paths,
  Path extends PathsWithMethod<Paths, "get">,
  Mode extends ResponseMode = "auto",
> = SuccessResponse<Operation<Paths, Path, "get">, Mode>;

export type PostResponse<
  Paths,
  Path extends PathsWithMethod<Paths, "post">,
  Mode extends ResponseMode = "auto",
> = SuccessResponse<Operation<Paths, Path, "post">, Mode>;

export type PutResponse<
  Paths,
  Path extends PathsWithMethod<Paths, "put">,
  Mode extends ResponseMode = "auto",
> = SuccessResponse<Operation<Paths, Path, "put">, Mode>;

export type PatchResponse<
  Paths,
  Path extends PathsWithMethod<Paths, "patch">,
  Mode extends ResponseMode = "auto",
> = SuccessResponse<Operation<Paths, Path, "patch">, Mode>;

export type DeleteResponse<
  Paths,
  Path extends PathsWithMethod<Paths, "delete">,
  Mode extends ResponseMode = "auto",
> = SuccessResponse<Operation<Paths, Path, "delete">, Mode>;

export type GetQuery<Paths, Path extends PathsWithMethod<Paths, "get">> =
  Operation<Paths, Path, "get"> extends {
    parameters: { query?: infer Query };
  }
    ? NonNullable<Query>
    : never;

export type PostBody<Paths, Path extends PathsWithMethod<Paths, "post">> = Body<
  Operation<Paths, Path, "post">
>;

export type PutBody<Paths, Path extends PathsWithMethod<Paths, "put">> = Body<
  Operation<Paths, Path, "put">
>;

export type PatchBody<
  Paths,
  Path extends PathsWithMethod<Paths, "patch">,
> = Body<Operation<Paths, Path, "patch">>;

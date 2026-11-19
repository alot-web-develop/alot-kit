# @alot-web-develop/server

Shared backend contracts for Node 24, Fastify 5 and Zod 4. No database or auth
provider is included. The Fastify generator consumes the public package exports.

```ts
import Fastify from "fastify";
import {
  authPlugin,
  currentUser,
  errorHandler,
  notFoundHandler,
  ok,
  protectedScope,
  publicScope,
  requireRole,
} from "@alot-web-develop/server";
import type { TAuthAdapter } from "@alot-web-develop/server";

// Implement this against your session provider; never trust a client role header.
declare const adapter: TAuthAdapter;
const app = Fastify();
app.setErrorHandler(errorHandler);
app.setNotFoundHandler(notFoundHandler);
await app.register(authPlugin, { adapter });
await app.register(
  publicScope(async (scope) => {
    if (scope.auth.routes)
      await scope.register(scope.auth.routes, { prefix: "/auth" });
  }),
  { prefix: "/api" },
);
await app.register(
  protectedScope(async (scope) => {
    scope.get("/me", async (request) => ok(currentUser(request)));
    scope.get("/admin", { preHandler: requireRole("admin") }, async () =>
      ok(null),
    );
  }),
  { prefix: "/api" },
);
```

`TAuthAdapter` supplies `getUser(request): Promise<TAuthUser | null>`, optional
Fastify `routes`, and optional async `close`. Users have `id`, `email`, and `role`.
`authPlugin` decorates requests with `user: null` and closes the adapter once when
its scope closes. It does not mount routes or resolve sessions automatically.
`protectedScope` installs `requireAuth` on request; public sibling scopes remain
public. Missing sessions return 401, role mismatches return 403. `requireRole`
and `currentUser` require an already authenticated request. Ownership checks,
role assignment and domain permissions remain the application's responsibility.

`toWebHeaders` and `webHandlerRoutes(handler)` integrate a Web Request auth
provider such as Better Auth. Mount the latter at the provider's configured
prefix. GET/HEAD and POST preserve query strings, request bytes, binary response
streams, response status and separate Set-Cookie headers. Body parsers are
overridden only in that route scope; Fastify's `bodyLimit` still applies. The
provider's HTTP response is forwarded directly without the application envelope.

`ok(data)` returns `{ success: true, data }`; `fail(code, message, details?)`
returns `{ success: false, error: { code, message, details? } }`. Matching Zod
schemas are `okSchema(dataSchema)` and `errorSchema`; exported types include
`TOk<T>`, `TFail`, `TErrorBody` and `TEnvelope<T>`. Configure the validators and
serializers from `fastify-type-provider-zod` in applications using these schemas.
It is a consumer integration dependency, not required internally by this package.

`HttpError` accepts status 400–599. Factories `badRequest`, `unauthorized`,
`forbidden`, `notFound`, `conflict` provide stable uppercase codes. The global
handler maps request validation and directly thrown Zod errors to 400, preserves
explicit 4xx errors, and logs/hides all 5xx and unknown errors behind
`INTERNAL_ERROR`. `notFoundHandler` supplies the 404 envelope for unknown routes.
Only put information safe for clients in 4xx messages and details.

`paginationQuerySchema` coerces query strings, rejects invalid HTTP input and
defaults to page 1 / limit 20 (maximum 100). `parsePagination(query)` normalizes
internal numbers and returns `{ page, limit, skip }`, bounding the offset to a
safe integer; non-finite numbers use defaults. `paginated(items, total, query)`
returns `{ items, total, page, limit, totalPages }`; `paginatedSchema(itemSchema)`
describes it. Supply a nonnegative integer count from your persistence layer.
`objectIdSchema` validates 24 hex characters without importing a DB driver.

Extend `baseEnvSchema` and call `loadEnv(schema, options)` once during startup.
Base keys are NODE_ENV, HOST, PORT (1–65535), LOG_LEVEL and CORS_ORIGINS.
`csvSchema` trims comma-separated strings to an array. `groups` requires
credential keys together when any is configured; `requiredInProduction` requires
explicit nonblank source values. `source` defaults to `process.env` and is never
mutated. Failures list keys and issue codes, omitting source values and schema
messages that could contain secrets. Provider secrets and optional blank-value
preprocessing belong in the application's extended schema; no secret defaults
or dotenv loading are provided.

`healthRoutes` serves `/health/live` and `/health/ready`. Liveness always returns
200 with uptime, timestamp and version; readiness runs named checks concurrently
and returns 503 while any throws, recovering on the next successful check.
`exposeErrors` defaults to false. Configure dependency timeouts in each check.

The separate `@alot-web-develop/server/upload` entry implements the fixture's
small R2 transport contract using AWS SDK v3. `sanitizeFileName` strips directory
components and bounds filenames; `buildObjectKey` creates
`scope/ownerId/UUID-filename` with single safe namespace segments.
`validateUpload` checks filename/namespace, declared size and an exact MIME
allowlist. `createUploadService(config, rules)` offers `presignPut`, `presignGet`,
`head` and `remove`. PUT signatures bind content type/length and expire after
15 minutes; GET expiry is configurable from 1 second to 7 days. Only a missing
object becomes null from `head`; authorization and transport errors propagate.
Signing is local; head/delete make storage requests. Callers must authorize
scope/owner/key access, verify uploaded metadata/content and persist domain
records. No upload routes, database records or multipart processing are added.

Run `pnpm install`, `pnpm check`, and
`pnpm --filter @alot-web-develop/server test:integration`. Integration builds and
packs the actual package, generates every Fastify kind for mongodb-native and
mongoose, typechecks both consumers and runs their route/auth/env checks through
Fastify injection. Driver doubles avoid DB sockets; real Better Auth uses its
memory persistence adapter. These checks verify consumer wiring, ownership,
session cookies/Bearer, revocation, origin checks and envelopes, not real database
query/index/reconnection behavior. Upload tests sign real SDK URLs locally and
double head/delete commands; no remote service is contacted.

References: [Fastify encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/),
[Fastify errors](https://fastify.dev/docs/latest/Reference/Errors/),
[Zod schemas](https://zod.dev/api),
[Cloudflare R2 SDK configuration](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/).

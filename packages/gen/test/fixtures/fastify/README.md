Fastify template consumer using real Fastify, Zod, Better Auth, MongoDB and Mongoose packages. `test/fastify/verify.mjs` builds and packs `packages/server`, installs that tarball with pnpm, generates every Fastify kind for both DB variants and runs TypeScript plus injection tests. No shared-server stub or TS source alias is used.

The verifier installs `testing/setup.ts` and replaces only the generated database-backed test helper with `testing/app-helper.txt`. Driver doubles implement the small persistence surface used by generated CRUD services. Better Auth runs its real HTTP/session/cookie/origin code with its official memory adapter replacing MongoDB persistence. No DB process, socket or remote service is started. This checks consumer integration, auth, ownership, errors, env and readiness transitions; it does not verify MongoDB query semantics, index creation or actual driver reconnection. Production templates and checked-in generated examples retain their database-backed helpers.

Run from the repository root after `pnpm install`:

```sh
node packages/gen/test/fastify/verify.mjs
# Optional: --db=mongodb-native, --db=mongoose, --keep
```

Successful runs remove their temporary consumer directories unless `--keep` is supplied; failed consumers remain available for diagnosis. R2 transport is covered by `packages/server/test/upload.test.ts`, using real local SDK signing and command doubles.

From the repository root with Node 24:

```sh
node packages/gen/test/fastify/verify.mjs
node packages/gen/test/fastify/verify.mjs --db=mongodb-native
node packages/gen/test/fastify/verify.mjs --db=mongoose --update-examples
```

The verifier generates all 13 kinds into new temporary directories, including both `Order` and multiword `OrderItem` resources. It applies the manifest DB conditions and registration hints, installs dependencies without a lockfile, runs strict TypeScript, then exercises generated routes with `inject`. Contract checks cover real cookie/Bearer login and revocation, roles, ownership, root health probes, degraded DB recovery, OpenAPI, frontend pagination/search/CORS and environment validation. Every database is ephemeral; no external DB or storage credentials are used.

`--legacy-peer-deps` avoids unrelated optional framework peers of Better Auth; direct framework APIs are typechecked. `@fastify/swagger` stays at the verified fixture version. MongoDB binaries download on demand; set `MONGOMS_DOWNLOAD_DIR` for a reusable cache. The verifier prints each fixture path and copies examples only after that variant passes. The production generator CLI and shared server package remain subsequent work.

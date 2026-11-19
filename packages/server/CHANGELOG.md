# @alot-web-develop/server

## 0.2.0

### Minor Changes

- 3682ced: Publish publicly on npm under the MIT license. Installing no longer requires a GitHub Packages token or a scoped registry entry.

## 0.1.0

### Minor Changes

- e6c1e12: Implement the Fastify generator's shared backend contracts: response schemas,
  pagination, error handling, validated environment loading, generic authentication
  adapters and scopes, Web Request forwarding, health probes and the R2 upload
  transport subpath. Verify generated native MongoDB and Mongoose consumers against
  the packed package using database doubles and real Better Auth with in-memory
  persistence, without remote services or database processes.

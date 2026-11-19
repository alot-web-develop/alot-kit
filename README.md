# alot-kit

Shared packages for the alot-web-develop stack. The `alot-gen` CLI (`help`, `list`, `snippets`, `<kind> <Name>`) and its React and Fastify templates live in `packages/gen/`. The verifiers pack the real packages, install the tarballs into a clean fixture, run the installed `alot-gen` and typecheck/build/test the result: `node packages/gen/test/react/verify.mjs` and `node packages/gen/test/fastify/verify.mjs [--db=mongodb-native|mongoose]`. Set `PNPM_STORE_DIR` to reuse a pnpm store.

| Package                       | Responsibility                   |
| ----------------------------- | -------------------------------- |
| `@alot-web-develop/design`    | Design tokens and themes         |
| `@alot-web-develop/ui`        | shadcn React web primitives      |
| `@alot-web-develop/ui-native` | Deferred scaffold, not published |
| `@alot-web-develop/ui-svelte` | Deferred scaffold, not published |
| `@alot-web-develop/utils`     | Framework-independent utilities  |
| `@alot-web-develop/api`       | Fetcher and API helpers          |
| `@alot-web-develop/server`    | Shared backend utilities         |
| `@alot-web-develop/gen`       | Generator CLI and templates      |

## Development

Use Node 24 and pnpm 12.16.1 (for example, install with `npm install -g pnpm@12.16.1`), then `pnpm install` and `pnpm check`. Older Corepack versions cannot launch pnpm 12. The check runs build, typecheck, Biome and Vitest. Biome provides formatting and linting in one fast tool with a single configuration. Run `pnpm exec biome check --write .` to apply fixes. Add a changeset with `pnpm changeset` for publishable changes.

## Consuming packages

The packages are public on npm under the `@alot-web-develop` scope; no registry configuration or token is needed.
For applications, install the packages they use; install the CLI as a development dependency:

```sh
pnpm add @alot-web-develop/design @alot-web-develop/ui @alot-web-develop/utils @alot-web-develop/api
pnpm add -D @alot-web-develop/gen
pnpm exec alot-gen --help
```

Fastify APIs use `@alot-web-develop/server` with Fastify 5 and Zod 4. React UI requires React/React DOM 19.
The UI package depends on the matching version of design. `ui-native` and `ui-svelte` are marked private in their
manifests to prevent publishing incomplete scaffolds. The six implemented packages are versioned together.
If a consumer enforces a minimum package age, exempt only the trusted `@alot-web-develop/*` scope to use a new release.

## Release

Releases are automatic from `main` with Changesets 3:

1. A pull request that changes a published package adds a changeset (`pnpm changeset`).
2. When it is merged, the Release workflow opens or updates a "Version Packages" pull request with the new versions and changelogs.
3. Merging that pull request publishes the changed packages to npm and pushes their Git tags.

Every run checks the workspace and verifies changeset coverage since the latest release tag. Publishing uses npm
trusted publishing (OIDC) from `release.yml`: no npm token is stored and every version gets provenance. After a
publication, `pnpm verify:registry` installs all six exact versions into a disposable consumer and exercises real
HTTP API/server interoperability, UI rendering, design CSS resolution, utils and the installed CLI; it also runs
locally without credentials. The workflow can be started manually (Actions → Release) with an optional base ref.

## License

[MIT](LICENSE). `packages/ui` includes components derived from shadcn/ui; see `packages/ui/LICENSE.shadcn.md`.

## Implementation and release readiness

During implementation package versions stay unchanged. New utils guards in source and the generator's module selection/OpenAPI command are not thereby present in the existing registry 0.1.0 artifacts. Inspect the consumer's resolved exports, or verify authorized local build/pack artifacts; do not invent imports into registry-only consumers.

Before an explicitly authorized release run `pnpm release:check --since <last-released-git-ref>`. Pending changesets cover implementation changes. After the version PR consumes them, a committed higher stable version with its changelog and no subsequent uncovered package edits is accepted instead. The gate fails for uncovered changes and never bumps or publishes. The manually triggered release workflow requires the same baseline and gate. Ordinary implementation CI does not force release metadata. Prepare and review changesets/version changes in the later release task.

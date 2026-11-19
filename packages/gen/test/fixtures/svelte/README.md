# Svelte template fixture

Run from the worktree root with Node 24:

```sh
node packages/gen/test/svelte/verify.mjs
```

The script copies this fixture to a fresh temporary directory, generates all 26 Svelte kinds with `Order`, feature `orders`, entity `Order`, plural `Orders`, and generates a second store using `--persisted`. It installs the pinned direct dependencies with `npm install --package-lock=false --ignore-scripts --no-audit --no-fund`, compiles every unexpanded `.svelte` template to validate placeholder syntax, runs `svelte-kit sync`, runs `svelte-check --fail-on-warnings`, and runs the behavior tests. A failed subprocess makes the script exit nonzero. Dependencies and generated SvelteKit files stay outside the workspace.

To reuse a scratch directory and refresh the committed examples after successful verification:

```sh
SVELTE_FIXTURE_DIR=/private/tmp/alot-gen-svelte-approved node packages/gen/test/svelte/verify.mjs --update-examples
```

An existing output must identify itself as this fixture. Its `src`, `stubs`, `test`, and `.svelte-kit` directories are regenerated. Without `SVELTE_FIXTURE_DIR`, every run starts fresh. No lockfile is created or required; direct versions are pinned in `package.json`, while transitive versions follow their package ranges.

The local `test/svelte/prototype.mjs` extends the original `alot-gen-proto/gen.mjs` with Svelte path defaults and manifest `variants.persisted.files` selection via `--persisted`. The production CLI is still a scaffold. Generate a single kind with:

```sh
node packages/gen/test/svelte/prototype.mjs packages/gen/templates /private/tmp/my-svelte-app svelte page Order orders Order Orders
node packages/gen/test/svelte/prototype.mjs packages/gen/templates /private/tmp/my-svelte-app svelte store Preferences orders Order '' --persisted
```

`stubs/` implements the proposed kit package contracts from `TEMPLATES.md`; it does not replace Svelte, SvelteKit, Svelte Query, Better Auth, Superforms, Formsnap, Zod, or Sonner. The kit packages themselves remain scaffolds. The form stub uses real Superforms client validation/enhancement and Formsnap field/error components. The API stub implements the result union, bearer headers and `ApiError` behavior. Theme CSS retains the real design-package import, whose implementation/build is outside this fixture's typecheck scope.

The fixture uses SvelteKit 2's `$app/*` imports and Svelte 5 runes. Real kit dependencies are not required for the fixture because aliases point to the contract implementations. It sets `PUBLIC_API_URL=https://api.example.test` only for local verification. Tests mock auth/API responses; they never contact that host.

Behavior tests cover 4xx retry suppression, bounded transient retries, global query/mutation toasts, per-provider query/i18n isolation, feature locale registration, URL filter normalization, request-scoped auth/cookie forwarding, expired-session redirects, server action validation and bearer writes, backend form errors, and persisted/ordinary stores. No live backend or interactive browser end-to-end test is included.

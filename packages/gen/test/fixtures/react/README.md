React template fixture. `@alot-web-develop/{design,ui,utils,api}` are the real packages, built and packed by the verifier and installed from `file:./alot-<pkg>.tgz` (no stubs, no source aliases); `pnpm-workspace.yaml` overrides the transitive `design` dependency of `ui` with the same tarball.

With Node 24 and pinned pnpm, from the repository root:

```sh
pnpm install
node packages/gen/test/react/verify.mjs
```

The verifier generates every React kind plus persisted store, builds/packs design/ui/utils/api, installs real framework dependencies using pnpm, generates routes, and runs strict TypeScript, `vite build` (Tailwind v4 over the packed design/ui CSS) and behavior checks. It reuses the store configured at the root (`pnpm store path`), or `PNPM_STORE_DIR`/`npm_config_store_dir`. Set `PNPM_PACKAGE_IMPORT_METHOD=hardlink` to enforce hardlinks on a shared filesystem; default auto supports CI across filesystems. Peer auto-installation is disabled to avoid unrelated optional framework peers. Fixture, tarball and temporary dependencies are removed in finally; shared caches stay intact.

Checks cover auth, query policy, theme storage, store rehydration, locale collection, installed utils root/subpaths, actual Day.js formatting and locale-aware generated date columns. Native ESM smoke imports all utils subpaths without browser/file globals. `components.check.tsx` renders the app-local composites (QueryBoundary, DataTable, ListPagination, Form helpers) on the real ui primitives. `--update-examples` refreshes generated examples.

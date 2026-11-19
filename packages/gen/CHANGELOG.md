# @alot-web-develop/gen

## 0.2.0

### Minor Changes

- 3682ced: Publish publicly on npm under the MIT license. Installing no longer requires a GitHub Packages token or a scoped registry entry.

## 0.1.0

### Minor Changes

- c9ab1d9: Generate parent-scoped React collections with consistent service, query-key, query and mutation contracts using --parent. Normalize form/hook names to prevent FormForm/useUse duplication while preserving existing files.
- 502990a: Real `alot-gen` CLI (`help`, `list`, `snippets`, `<kind> <Name>`) with a shared renderer: config roles, variants, flags, `when`, placeholders, idempotent wiring, dry-run, no overwrite without `--force`, and path traversal/symlink checks. Templates ship in the tarball. React templates now import only real `ui` primitives, and the new `app-components` kind generates the app-local composites.

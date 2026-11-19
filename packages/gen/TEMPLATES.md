# alot-gen template format

A template is real source code. It establishes programming conventions as well as reducing boilerplate: taxonomy, naming, named exports, logic boundaries and package contracts. Generated consumers are typechecked and executed against real packaged dependencies; repository lint alone does not inspect placeholder templates.

## Layout

```
templates/<framework>/<kind>/
  template.json
  <files with placeholders>
```

Frameworks: `react`, `react-native`, `svelte`, `fastify`.

## Placeholders

| Token                                             | Case                                                 | `OrderItem` →                               |
| ------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| `__Name__`                                        | Pascal                                               | `OrderItem`                                 |
| `__name__`                                        | camel                                                | `orderItem`                                 |
| `__name-kebab__`                                  | kebab (strings/paths only)                           | `order-item`                                |
| `__NAME__`                                        | SCREAMING_SNAKE                                      | `ORDER_ITEM`                                |
| `__Names__` / `__names__` / `__names-kebab__`     | plural (auto, `--plural` overrides)                  | `OrderItems` / `orderItems` / `order-items` |
| `__feature__`                                     | camel, from `--feature`                              | `orders`                                    |
| `__Entity__` / `__entity__`                       | Pascal / camel, from `--entity`                      | `Order` / `order`                           |
| `__Parent__` / `__parent__` / `__parents-kebab__` | Pascal / camel / plural kebab, from `--parent Order` | `Order` / `order` / `orders`                |

Path tokens in `dest`: `{paths.<key>}` from `alot.config.json`, `{feature}`. A `dest` without a path token is relative to the repo root (e.g. `.env.example`).

`paths` keys (React defaults):

| Key          | Default             | Used by                                                       |
| ------------ | ------------------- | ------------------------------------------------------------- |
| `src`        | `src`               | `main.tsx`, `vite-env.d.ts`, `app.css`                        |
| `app`        | `src/app`           | `AppProviders`, `router`, `layout/*` (app shell)              |
| `lib`        | `src/lib`           | `queryClient`, `i18n/*`, `auth/*`, `theme/*`                  |
| `config`     | `src/config`        | `env`                                                         |
| `routes`     | `src/routes`        | TanStack Router file routes (`__root`, `login`, `_app/**`)    |
| `locales`    | `src/locales`       | common locales `{it,en}.ts`                                   |
| `features`   | `src/features`      | feature pages/components/hooks/schemas/locales/stores/context |
| `api`        | `src/api`           | `client`, `services`, `keys`, `queries`, `mutations`          |
| `utils`      | `src/utils`         | project-only utils                                            |
| `primitives` | `src/components/ui` | `primitive` (ui-lib only)                                     |

## template.json

```json
{
  "kind": "page",
  "framework": "react",
  "description": "Feature page: orchestration only",
  "prefix": "alot-page",
  "scope": "typescriptreact",
  "requiresFeature": true,
  "role": ["app"],
  "files": [
    {
      "src": "__Name__Page.tsx",
      "dest": "{paths.features}/{feature}/pages/__Name__Page.tsx",
      "snippet": true
    }
  ],
  "next": ["subcomponent", "query"]
}
```

- `requiresEntity`: kind needs `--entity` (e.g. subcomponent named `OrderSummary` typed on `TOrder`).
- `role`: which `alot.config.json` roles may generate it (`primitive` → `["ui-lib"]` only).
- `snippet: true`: file becomes a VS Code snippet (`alot-gen snippets`); `__Name__` → `${1:${TM_FILENAME_BASE}}`, other cases → transforms of `$1`, `__feature__` → `${2:feature}`; `$` and `}` escaped.
- `next`: kinds the agent usually generates after this one (hint only).
- `variant` (per file, optional): file is written only when `--variant <v>` matches (`default` when the flag is omitted). Files without `variant` are always written. Variants of one kind may share a `dest` (e.g. `store` default vs `persist`). Snippet prefix of a non-default variant: `<prefix>-<variant>`.

## CLI

```
alot-gen <kind> <Name> [--feature <f>] [--entity <E>] [--plural <P>] [--parent <Entity>] [--variant <v>] [--persist] [--dry-run] [--force]
alot-gen help
alot-gen list
alot-gen snippets            # writes .vscode/alot.code-snippets
```

Never overwrites existing files without `--force` (reported as `skip`). `--dry-run` writes nothing. Destinations that are absolute, contain `..` or escape the repo through a symlink are rejected before any write. `--persist` (alias `--persisted`) selects supported `flag`/`unlessFlag` files in React Native/Svelte; React stores use `--variant persist`. `wire` entries are applied once (idempotent) and reported as `todo` when the target or anchor is missing. Prints `created`/`skip`/`wired` lines.

Use base names: `form Recipe --feature recipes` creates `RecipeForm`; `hook PhotoUploads --feature photos`
creates `usePhotoUploads`. Passing `RecipeForm` or `usePhotoUploads` produces the same canonical destinations,
so an existing implementation is skipped rather than duplicated under `FormForm` or `useUse` names.

### Parent-scoped React collections

For the REST contract `GET/POST /recipes/:recipeId/variants` and `GET/PATCH/DELETE /variants/:id`:

```sh
alot-gen service Variant --parent Recipe
alot-gen query-keys Variant --parent Recipe
alot-gen query Variant --parent Recipe
alot-gen mutation Variant --parent Recipe
```

Pass the same parent to all four kinds. List and create take `recipeId`; detail/update/delete keep their global
IDs. Parent IDs are encoded as URL segments. Query keys include the parent; creation invalidates every filtered
list for that parent only, while update/delete invalidate across lists. List queries wait for a nonempty parent.
`list` advertises supporting kinds. Other frameworks/kinds reject `--parent`; backend parent ownership is domain
logic and is not generated by this flag. Fully nested detail URLs, different parents for list/create, custom
parent plurals and multi-level resources require explicit adaptation of the service/key/hook contracts.

The manifest uses `flag: "parent"` / `unlessFlag: "parent"` to select the alternate source files. Default CLI
output and default snippets retain the flat resource contract. Do not generate every kind solely for coverage;
keep the generated responsibility boundaries when completing or adapting domain logic.

## Rules encoded by the templates (framework-agnostic)

- `{ children, className, ...rest }`, fixed classes first, `className` last via `cn`.
- Named exports only, at the bottom: `export { X }`.
- primitive = CVA variants, only in the UI lib. composite = compound built from primitives.
- page = orchestration: receives route params as props (router-agnostic), reads queries, renders subcomponents inside `QueryBoundary`. No formatting, no business logic.
- subcomponent = data via props, formatting via `@alot-web-develop/utils`, logic via hooks.
- data: service (fetcher result union) → keys factory → query/mutation (`unwrap`) → component.
- form: zod schema file + app-local `useZodForm` / `Form*` from `@/components/form` (generated by `app-components`; `@alot-web-develop/ui` ships only primitives).
- tokens only: semantic Tailwind classes (`bg-surface-1`, `text-foreground`, `border-border`).

The real React tarball verifier lints generated sources for named exports and absence of explicit `any`,
then typechecks, builds and executes behavior checks. Router-generated `routeTree.gen.ts` is excluded from
those source-style rules because its content belongs to the router generator. Domain adaptations still
need the consuming project's full lint and review to preserve service/query/UI responsibility boundaries.

## App layout produced (`alot.config.json` defaults)

```
src/
  main.tsx, app.css, vite-env.d.ts
  app/{AppProviders.tsx,router.ts,layout/}
  config/env.ts
  lib/{queryClient.ts,i18n/,auth/,theme/}
  locales/{it,en}.ts   ← `common.*` keys
  api/{client.ts,services,keys,queries,mutations}
  features/<feature>/{pages,components,hooks,utils,schemas,locales,stores,context}
  utils/            ← project-only helpers (shared ones come from @alot-web-develop/utils)
  types/main-api-types.ts
  routes/           ← thin TanStack file routes, import feature pages
    __root.tsx, login.tsx
    _app/            ← pathless layout: RequireAuth + AppLayout; feature routes live here
      route.tsx, index.tsx, <names-kebab>/{route.tsx,index.tsx,$<name>Id.tsx}
  routeTree.gen.ts  ← generated by the TanStack Router plugin / `tsr generate`
```

React conventions for the init/task kinds below:

- Router: TanStack Router file routes. Route files `export { Route }` with the full route id (`createFileRoute('/_app/orders/')`). Pages stay router-agnostic: the route reads params/search and passes them (plus callbacks such as `onSearchChange`) as props.
- i18n: one `translation` namespace, keys `common.*` and `<feature>.*`. Feature locale files `features/<f>/locales/{it,en}.ts` export `locale` and augment `TranslationResources` in `@/lib/i18n/resources` (typed keys); `lib/i18n` loads them with `import.meta.glob`, so no manual registration. `en` is typed as `typeof it`.
- Auth: the default Better Auth adapter uses HTTP-only cookie sessions (`credentials: include` on API requests); `getToken` returns `null` intentionally. The API must accept that session cookie. A bearer-token backend needs a different adapter. Only `lib/auth/betterAuth.ts` imports `better-auth`. Everything else imports `@/lib/auth` (`AuthProvider`, `useSession`, `signIn`, `signOut`, `getToken`) or `@/lib/auth/RequireAuth`. Swapping provider = new adapter file + one line in `lib/auth/index.ts`.
- Init kinds are generated together (they import each other: `api-client` → `env` + `auth`, `providers` → `query-client` + `i18n` + `theme` + `auth`, `auth`'s login route navigates to `/` from `app-layout`).


## Package contracts the templates rely on

Packages must expose exactly these, or templates and packages drift.

`@alot-web-develop/ui` (React web): exactly the 31 shadcn primitives plus `cn`, importable per subpath (`@alot-web-develop/ui/button`, `/card`, `/table`, `/pagination`, `/sheet`, `/skeleton`, `/input`, `/label`, ... see `packages/ui/src/index.ts`) and `/lib` → `cn(...classes)`. It contains no composites: no Box, PageShell, QueryBoundary, forms, controlled DataTable, Toaster or sidebar. Those are generated into the app by the `app-components` init kind under `{paths.src}/components` (`PageShell`, `QueryBoundary`, `DataTable`, `ListPagination`, `ErrorBoundary`, `Toaster` on sonner, `form/` with `useZodForm`, `Form`, `FormInput`) and built from the primitives.

`@alot-web-develop/design`
- Semantic colors (`--<name>` vars, `bg-<name>` / `text-<name>` / … utilities): shadcn set (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1..5`, `sidebar-*`, each with its `-foreground` where it applies) plus alot extensions `surface-0..3` (elevation steps, `foreground` text on all of them) and `success` / `warning` / `info` with `-foreground`. Also `--radius` (`rounded-sm..2xl`), `--typeface-sans|heading|mono` (`font-sans|heading|mono`). Every text pair meets WCAG AA (4.5:1); `test/themes.test.ts` enforces it for the default theme and for the brand fixtures. The package ships only the neutral `default` theme. Brand themes live in each app as variable overrides or `createTheme(...)`.
- `/tailwind.css` (web, Svelte) → `@custom-variant dark` bound to `.dark`, an `@theme inline` block mapping every semantic token to its var (utilities resolve to `var(--primary)`, so runtime overrides work), default theme light values on `:root`, dark values on `.dark`. Import after `tailwindcss`. Apps override vars in `:root` / `.dark` and add tokens with their own `@theme inline` block.
- `/nativewind.css` (React Native) → same `@theme inline` mapping; dark values in `@media (prefers-color-scheme: dark) { :root {} }`, no `.dark` and no custom variant (NativeWind v5 drives `dark:` from the color scheme and rejects class-qualified selectors on native). `--radius` is emitted in px because `react-native-css` converts rem with a 14px base. Apps put dark overrides in the same media query.
- `/tokens.css` → default theme variables only, for CSS without Tailwind.
- `.` → `themes`, `createTheme(base, overrides)` (typed deep merge), `SEMANTIC_COLORS`, `CONTRAST_PAIRS`, `contrastRatio`, CSS renderers. `/native` → `nativeThemes` / `toNativeTheme(theme)` (camelCase colors per scheme, radius in px, typefaces) for StyleSheet or `react-native-paper` themes and `ui-native` `useThemeColors`.

`@alot-web-develop/api`
- `createFetcher({ baseUrl, getToken?, onUnauthorized?, headers?, credentials? })` (`headers` = object or sync/async function resolved per request, used by React Native to attach the Better Auth session cookie; `credentials` = `RequestCredentials`, `'include'` for browser cookie sessions, `'omit'` when the cookie is set manually) → client with `get/post/put/patch/delete<T>(path, { query?, body?, signal? })` returning `Promise<ApiResult<T>>`
- `ApiResult<T> = { error: false; data: T; errorDetails: null } | { error: true; data: null; errorDetails: { title; message; status? } }`
- `unwrap(promise)` → resolves `data` or throws `ApiError` (used in `queryFn` / `mutationFn`)
- `ApiError extends Error` with `title` and `status?` (from `errorDetails`)
- type helpers `GetResponse`, `PostBody`, … over generated `paths`

`@alot-web-develop/utils`
- `/format` → `formatDate(value, locale?, { pattern?, timeZone?, inputFormat? })` (Day.js, localized `L` by default, en/it included); `formatCurrency`, `formatNumber` (locale param, `Intl`). Date strings are ISO calendar dates or offset-qualified instants; custom wall times require `inputFormat`.

App files assumed: `@/types/main-api-types` (domain `T*` aliases, from the contract command below or type-only workspace contracts). `@/api/client` (`api`) is produced by the `api-client` kind.

Other runtime deps the React templates import directly: `@tanstack/react-query`, `@tanstack/react-router` (+ Vite plugin or `@tanstack/router-cli`), `react-i18next` / `i18next`, `zod`, `zustand`, `better-auth` (only in `lib/auth/betterAuth.ts`), `vite` (client types, `import.meta.glob`).

## Kind catalog

`scope: init` kinds are generated once by `repo-init-agent` (app foundation). `scope: task` kinds are used by task agents during feature work. Every framework implements every kind that makes sense for it, using the framework-native mechanism.

### Frontend (react, react-native, svelte)

| Kind                                                | Scope  | Produces                                                                                                                                              |
| --------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app-entry`                                         | init   | entry file mounting `AppProviders` + router (React `main.tsx`, Expo root `_layout.tsx`, SvelteKit root `+layout.svelte`)                              |
| `providers`                                         | init   | `AppProviders`: QueryClient, Theme, i18n, Auth, Toaster, ErrorBoundary — one composition point                                                        |
| `query-client`                                      | init   | `lib/queryClient`: defaults (staleTime, retry skips 4xx, global error → toast)                                                                        |
| `api-client`                                        | init   | `api/client`: `createFetcher` with `getToken`, `onUnauthorized` → logout                                                                              |
| `env`                                               | init   | `config/env`: zod-validated public env, typed export, fails fast                                                                                      |
| `theme`                                             | init   | app stylesheet importing `@alot-web-develop/design` + override block (brand vars, extra `@theme` tokens) + ThemeProvider (light/dark/system)          |
| `i18n`                                              | init   | `lib/i18n` setup + `locales/{it,en}` + typed keys                                                                                                     |
| `auth`                                              | init   | `lib/auth` adapter interface (`useSession`, `signIn`, `signOut`, `getToken`) + default Better Auth impl + `RequireAuth` guard                         |
| `app-components` (React)                            | init   | app-local composites built on `ui` primitives (see package contracts); generate before `providers`, `app-layout` and task kinds                       |
| `app-layout`                                        | init   | root shell: header, sidebar/nav, content outlet, mobile variant                                                                                       |
| `layout`                                            | task   | feature/section layout (nested route layout with outlet, title, actions slot)                                                                         |
| `route`                                             | task   | thin router file: reads params/search, renders feature page (TanStack Router file route / Expo Router screen / SvelteKit `+page.svelte` + `+page.ts`) |
| `list-page`                                         | task   | list page: filters + search + pagination + table/list via `QueryBoundary`, query params synced to URL                                                 |
| `page`                                              | task   | detail page (approved)                                                                                                                                |
| `composite`, `subcomponent`, `form`, `hook`, `util` | task   | approved                                                                                                                                              |
| `service`, `query-keys`, `query`, `mutation`        | task   | approved                                                                                                                                              |
| `context`                                           | task   | typed context + provider + `use__Name__` hook throwing outside provider                                                                               |
| `store`                                             | task   | client state store (zustand / Svelte runes store), persisted variant via flag                                                                         |
| `locale`                                            | task   | feature locale namespace `features/<feature>/locales/{it,en}` registered in i18n                                                                      |
| `primitive`                                         | ui-lib | CVA primitive (approved)                                                                                                                              |

### Backend (fastify)

| Kind                                                                                     | Scope | Produces                                                                               |
| ---------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------- |
| `server-entry`                                                                           | init  | `index.ts` bootstrap: env, logger, plugins, public/protected scopes, graceful shutdown |
| `env`                                                                                    | init  | zod env loader, no secret fallbacks                                                    |
| `db`                                                                                     | init  | DB plugin (mongodb native or mongoose per config) + index bootstrap                    |
| `auth`                                                                                   | init  | auth plugin + `requireAuth` / `requireRole` preHandlers (adapter, Better Auth default) |
| `route`, `resource`, `service`, `schema`, `model`, `plugin`, `middleware`, `test`, `job` | task  | see section C of the plan                                                              |

## Svelte UI package contract

Svelte components are default exports from `.svelte` files, re-exported by name from barrels. Props use `class` and `children` snippets; compound components expose separate parts. Placeholder component imports use valid aliases such as `EntityHeader`, because a tag beginning with `__Name__` does not parse as a Svelte component before expansion. `@alot-web-develop/ui-svelte` must provide:

- `/lib` → `cn(...classes)`.
- `/box` → separate `Root`, `Header`, `Body`, and `Footer` components with HTML div props and snippets. Compound feature components compose these parts.
- `/page-shell` → `PageShell` with HTML div props, `class`, and a `children` snippet.
- `/query-boundary` → generic `QueryBoundary<T>({ query: CreateQueryResult<T>, isEmpty?, empty?, error?, loading?, children: Snippet<[T]> })`. `error` receives `(error: Error, retry: () => void)`; other state snippets take no arguments. Defaults render a loading skeleton, an empty state, and an error state with retry.
- `/form` → `useZodForm<T>(schema, { initial: () => SuperValidated<T>, onSuccess?: (values: T) => void })` returning `{ controller: SuperForm<T>, submitting: { readonly current: boolean } }`. It uses Superforms with `zod4Client(schema)` and calls `onSuccess` after a valid successful server result. `Form({ form, class, children, ...htmlFormProps })` renders `method="POST"` with the controller's `enhance` action and form-level errors. `FormInput({ form, name, label })` accepts string field paths, binds its value through Superforms and uses Formsnap `Field`, `Control`, `Label`, and `FieldErrors`. These helpers bridge library stores using `fromStore`; application state uses runes. Server actions independently call `superValidate(request, zod4(schema))` on the same schema and return the form on validation/API errors and success.

### Svelte application contracts

- SvelteKit 2 routing with Svelte 5 runes, `$app/state`, and snippets. Svelte Query hooks accept getter functions so changing route props and URL filters update query keys and query functions. `createQueryClient()` creates a client per provider, avoiding shared server caches. Its retry policy reads `error.status` or `error.errorDetails.status` and skips all 4xx errors. Query and mutation cache errors go to Sonner.
- `authAdapter: AuthAdapter` in `lib/auth.ts` supplies `useSession`, email/password `signIn`, `signOut`, and `getToken`. `useSession()` exposes `{ readonly current: SessionState }`, with `data`, `isPending`, and `error`. The default Better Auth implementation bridges its session store and retrieves a JWT through `jwtClient().token()`. `serverAuthAdapter: ServerAuthAdapter` in `lib/auth.server.ts` supplies request-scoped `getSession(event)` and `getToken(event)`. Replace both bindings when changing providers. There is no mutable global server session. Changing the user clears the provider's query cache.
- Better Auth runs on the API backend at `PUBLIC_API_URL` under its default `/api/auth` path. Enable email/password and its JWT plugin there; the API must verify the JWT. Session cookies must reach the SvelteKit request and the backend, with matching deployment origin/cookie settings. These are backend integration requirements, not generated placeholder implementations.
- `auth` generates `/login` (same path as React and React Native), a `(protected)/+layout.server.ts` redirect and a `(protected)/+layout.svelte` component guard/shell. Feature `route`, `layout`, `list-page`, and `form` routes live under that group. `requireSession(event)` must also run in sensitive child loads/actions; a layout guard does not serialize or authorize child server work. The form kind includes those checks. Client API unauthorized responses call the shared adapter's `signOut`.
- `theme` generates the design CSS import, brand overrides, one extra `@theme` color, `ThemeProvider`, and `useTheme()`. `mode` is `light | dark | system`; the provider restores/persists the preference, updates the root dark class/color scheme, and listens for system theme changes. Sonner follows the same preference. Storage failures are tolerated.
- `i18n` generates `I18nProvider` and `i18n.svelte.ts`. `useI18n()` exposes a per-provider locale, typed common-key `t`, and `setLocale`. `locale` generates matching English/Italian messages and an index exporting `namespace`, `en`, `it`, and typed `useFeatureTranslations()`. The i18n module eagerly registers all `src/features/*/locales/index.ts` namespaces. Generate a feature locale before generating its layouts, forms, or lists. State is scoped per provider; no request mutates global locale state.
- List responses use `{ items: TEntity[], total: number }`. List queries use `page`, `limit`, `search`, the same names as the React search schema and the Fastify CRUD list. URL changes drive the query, search updates reset page to 1, and browser history restores filters. Detail pages only orchestrate the query and generated header/content parts. Formatting stays in subcomponents.
- Stores export a class for construction per component/context. The ordinary variant is ephemeral. The local prototype's `--persisted` flag selects `template.json.variants.persisted.files` instead of the default files. Construct the persisted store during component setup so it can restore state after mount without a hydration mismatch. The persisted variant restores typed JSON, saves methods and direct assignments, supports a custom storage key, skips storage on the server, and tolerates unavailable/malformed storage. This prototype extension must be carried into the future production generator.

Svelte paths additionally require `paths.src`, `paths.routes`, `paths.lib`, and `paths.config` (defaults: `src`, `src/routes`, `src/lib`, `src/config`). The committed local prototype includes these defaults.

The reproducible fixture and scripts are in `test/fixtures/svelte` and `test/svelte`. Run `node packages/gen/test/svelte/verify.mjs` from the repository root. It generates every kind plus the persisted store, validates unexpanded Svelte syntax, checks generated sources with zero warnings, and runs behavior tests against real framework dependencies. Kit package aliases are implemented by the fixture stubs until those packages are built. Use `--update-examples` to refresh `examples/svelte` only after all checks pass.

## React Native (Expo) templates

Same rules and naming as React. Differences, all forced by the platform:

- Router = Expo Router. Route files live in `{paths.routes}` (`app/`, repo root, not under `src/`) and are the default-export exception. Groups: `(auth)/` public, `(app)/` behind `RequireAuth`.
- Pages stay router-agnostic. Routes read `useLocalSearchParams` and pass props/callbacks (`router.setParams` for list `search`/`page`, same names as the React search schema, `router.push` for selection).
- No DOM: `View`/`Text`/`Pressable`/`FlatList`; text always inside `Text` (`@alot-web-develop/ui-native/text`). `Button` takes `onPress`; RN has no form submit, so `Form` only provides RHF context and the submit button calls `form.handleSubmit(onSubmit)()`.
- Non-`className` props (tab bar, header, `contentStyle`) take colors from `useThemeColors()` (`ui-native/theme`), never hex.
- Auth uses Better Auth cookie sessions through `@better-auth/expo`: `expoClient` stores the session cookie in `expo-secure-store` (prefix and deep-link scheme = `EXPO_PUBLIC_APP_SCHEME`). React Native has no browser cookie jar, so the adapter adds `getAuthHeaders()` (`{ Cookie: await authClient.getCookie() }`) and `api/client` sends it through `createFetcher({ headers: getAuthHeaders, credentials: 'omit' })`, as the Better Auth Expo guide requires. `getToken` stays in the adapter interface for parity with React and returns `null`. The backend must enable the `expo()` plugin and trust the app scheme: Fastify `auth` does it when `MOBILE_APP_SCHEME` is set (and the `mobile` module is enabled). Theme mode and persisted stores use AsyncStorage, and `focusManager` is bound to `AppState` in `queryClient.ts`.
- Env: only `EXPO_PUBLIC_*`, each read as a static `process.env.NAME` (Expo inlines them).

### Extra path keys (prototype generator needs them; local copy in `test/fixtures/react-native/gen.mjs`)

`src` (`src`), `lib` (`src/lib`), `config` (`src/config`), `routes` (`app`). Same keys the Svelte templates use, only `routes` differs per framework. Destinations also use fixed sub-folders: `src/providers/`, `src/locales/`, `src/lib/auth/`, `app/(app)/<feature>/`, `app/(auth)/`, root files `global.css`, `metro.config.js`, `postcss.config.mjs`, `nativewind-env.d.ts`, `.env.example`.

### Manifest extension: per-file flags (used by `store`)

A `files` entry may carry `"flag": "persist"` (only with `--persist`) or `"unlessFlag": "persist"` (only without). `store` ships `use__Name__Store.ts` and `use__Name__Store.persisted.ts` (both land on `use__Name__Store.ts`). The CLI implements `--persist`.

### Wiring after generation

- `locale`: registered automatically through `wire` entries (same format as Fastify). The generator adds the import and `<feature>: <feature>En` / `<feature>It` inside the flat `const features = {` registry of `src/locales/{en,it}.ts`, which is spread into the root object. Keys are typed from `en`, and `it` is typed `typeof en`, so a missing translation fails typecheck.
- `layout` / `route` / `list-page`: nothing to register, Expo Router picks files up. Header actions: `<Stack.Screen options={{ headerRight }} />` inside the route.

### Kind notes

- `list-page` generates the page, `List`, `ListItem` and the list route `index.tsx` (URL sync lives in the route). Needs `T<Name>ListQuery` to include `search?: string`.
- `route` generates the detail route `[id].tsx`; the list route comes from `list-page`.
- `app-layout`: bottom `Tabs` + header replace sidebar; "mobile variant" is the only variant.
- `store` / `context` / `locale` are feature-scoped (`features/<feature>/{store,context,locales}`).
- `theme` uses NativeWind v5 (Tailwind v4, `react-native-css`). This is a decision: v5 is adopted while still RC. While it is RC, `repo-init-agent` applies the pins from the NativeWind v5 install guide (exact `nativewind` + `react-native-css` pair, `tailwindcss` / `@tailwindcss/postcss` at the tested version, `overrides.lightningcss`); see `test/fixtures/react-native/package.json`. Re-check the guide when v5 goes stable. `ThemeProvider` uses `Appearance.setColorScheme`, so it does not depend on the NativeWind API.

## `@alot-web-develop/ui-native` contracts

Subpaths mirror `ui`. All components accept `className` (fixed classes first, `className` last via `cn`).

- `/lib` → `cn(...classes)`
- `/types` → `ViewProps` (RN `ViewProps`; `className` comes from the NativeWind types)
- `/box` → `Box` with `Box.Header`, `Box.Body`, `Box.Footer` (Views)
- `/text` → `Text({ variant?: 'body' | 'title' | 'heading' | 'muted' | 'caption' })`
- `/button` → `Button({ variant, size, onPress, disabled, children })`; string children are wrapped in `Text` internally
- `/page-shell` → `PageShell({ scroll?: boolean })`: safe-area aware, `flex-1`, padded; `scroll` wraps in `ScrollView` (omit when the child is a `FlatList`)
- `/query-boundary` → same as web (`QueryBoundary<T>`), RN skeleton / empty / error-with-retry defaults
- `/form` → `Form({ form, className, children })` (RHF context only, no `onSubmit`), `useZodForm`, `FormInput`, `FormSelect`, `FormTextarea`, `FormCheckbox`, … (`name`, `label`, `description?`; `FormInput` also forwards `TextInput` props such as `secureTextEntry`, `keyboardType`, `autoCapitalize`, `autoComplete`, `textContentType`, except `value` / `onChangeText` / `onBlur`, which the form controls)
- `/search-input` → `SearchInput({ value, onSearch, placeholder?, debounceMs? })`, debounces internally
- `/toast` → `Toaster()` (mounted once in `AppProviders`), `toast.success|error|info(message)`
- `/error-boundary` → `ErrorBoundary({ children, fallback? })`
- `/theme` → `useThemeColors()` → resolved semantic colors for the active scheme: `background, foreground, card, primary, primaryForeground, mutedForeground, border, destructive`

`@alot-web-develop/api` additionally exports `ApiError` (`status?: number`), thrown by `unwrap` and used by `queryClient.ts` to skip retries on 4xx.

App-side packages the generated code imports: `expo-router`, `expo-secure-store`, `expo-localization`, `@react-native-async-storage/async-storage`, `react-native-safe-area-context`, `zustand`, `better-auth` + `@better-auth/expo` + `expo-network` (default auth adapter), `i18next` + `react-i18next`, `nativewind` v5.

## Styling decision (NativeWind vs StyleSheet): what changes

Templates are written for NativeWind (`className` + cva). If the decision is StyleSheet + `@alot-web-develop/design/native` tokens, these places change:

| Kind / file                                                                                                                | NativeWind (now)                                                             | StyleSheet variant                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `theme`                                                                                                                    | `global.css`, `metro.config.js`, `postcss.config.mjs`, `nativewind-env.d.ts` | all four dropped; `ThemeProvider` provides the `design/native` theme object (light/dark) via context         |
| `primitive`                                                                                                                | cva class strings + `cn`                                                     | `StyleSheet.create` per variant map + `style` prop merge; `cva`/`cn`/`class-variance-authority` dropped      |
| `composite`, `subcomponent`, `page/*`, `list-page/*`, `context`, `app-layout` (anything with `className="…"` or `cn(...)`) | utility classes                                                              | `style={…}` from `useTheme()` tokens (spacing/radius/typography scales); `cn` import dropped                 |
| `ViewProps` contract                                                                                                       | `className` via NativeWind types                                             | `className` removed from every `{ children, className, ...rest }` signature → `{ children, style, ...rest }` |
| `auth/RequireAuth`, `app-layout`                                                                                           | `className` on `View`                                                        | `style`                                                                                                      |
| `layout`, `app-layout`                                                                                                     | `useThemeColors()`                                                           | same hook, backed by the theme context (no change in call site)                                              |
| `ui-native/theme`                                                                                                          | resolves CSS-var colors for current scheme                                   | `useTheme()` returning the whole token object; `useThemeColors` kept as alias                                |
| `.claude` rule "fixed classes first, className last"                                                                       | applies                                                                      | replaced by "base style first, `style` last"                                                                 |

Unaffected: services, queries, mutations, keys, hooks, utils, store, locale, env, i18n, api-client, query-client, route, form (only the `className="flex-col gap-4"` on `Form`), providers (no styling).

## Fastify template contracts

All 13 backend kinds use Zod. `mongodb-native` is the default DB variant; `mongoose` selects the corresponding DB plugin, model and CRUD service. TypeBox is not implemented by these templates. `auth` uses a separate native MongoDB client with either application DB variant, so both `mongodb` and `mongoose` are dependencies of the Mongoose fixture.

### Paths and manifest extensions

Fastify defaults: `src=src`, `config=src/config`, `lib=src/lib`, `plugins=src/plugins`, `hooks=src/hooks`, `routes=src/routes`, `schemas=src/schemas`, `services=src/services`, `models=src/models`, `jobs=src/jobs`, `tests=test`.

- `when: { db: "mongodb-native" | "mongoose" }` on a file or wiring entry selects the DB implementation from `alot.config.json`.
- `alot.config.json` accepts optional `"modules": ["mobile", "uploads"]` for Fastify. An absent key enables both (including when using the programmatic API); `[]` disables both. `when: { mobile: "on" | "off", uploads: "on" | "off" }` still selects whole files. Auth and env each have one canonical source per output, with `// @alot-if mobile=on` / `// @alot-else` / `// @alot-endif` conditional blocks (`#` markers in `.env.example`). `|` combines module conditions with OR; blocks may nest. Generation and snippets strip inactive blocks and markers. Disabling `mobile` removes Expo imports and the mobile scheme; disabling `uploads` removes R2 keys and credential groups.
- `wire` entries describe a target `file`, an `import`, an `after` anchor and a `line`. Native models add their index builder to `models/index.ts`; resources and task routes register under `routes/protected.ts`. The CLI applies each registration once. The CLI applies them.
- `resource` includes schema, model, service, routes and tests. `route` includes a role-protected non-CRUD action, body/result schemas, service and tests. `test` can generate the CRUD route tests separately; the verifier checks that an existing file is preserved.

### `@alot-web-develop/server`

The verifier builds, packs and installs the real `packages/server` and `packages/gen`. The contract checks below
exercise those installed packages; they are not substitute server stubs.

| Exports                                                                         | Required behavior                                                                                                                                                       |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ok`, `fail`, `okSchema`, `errorSchema`                                         | `{ success: true, data: T }` or `{ success: false, error: { code, message, details? } }`; matching Zod response schemas                                                 |
| `HttpError`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`  | Error factories with HTTP status and stable code; `errorHandler` maps validation errors to 400 and hides unexpected internal errors behind a generic 500                |
| `errorHandler`, `notFoundHandler`                                               | Global handlers installed before routes; all error responses retain the envelope                                                                                        |
| `baseEnvSchema`, `loadEnv(schema, { groups?, requiredInProduction?, source? })` | Validate once, fail on missing secrets or incomplete credential groups, require explicit production CORS origins; error messages identify keys rather than their values |
| `authPlugin({ adapter })`, `TAuthAdapter`                                       | `getUser(request): Promise<TAuthUser \| null>`, optional Fastify `routes` and async `close`; `TAuthUser = { id, email, role }`                                          |
| `requireAuth`, `requireRole(...roles)`, `currentUser`                           | Delegate session validation to the adapter, allowing cookie and Bearer transports. Missing/invalid session is 401; wrong role is 403                                    |
| `toWebHeaders`, `webHandlerRoutes(handler)`                                     | Bridge Fastify requests to a Web Request handler; preserve status, response headers and separate Set-Cookie headers                                                     |
| `publicScope`, `protectedScope`                                                 | Encapsulated route plugins; protected scope installs the auth hook before registering handlers                                                                          |
| `healthRoutes({ checks?, version?, exposeErrors? })`                            | Public `/health/live` and `/health/ready`; DB outage keeps liveness at 200, readiness returns 503, recovery restores readiness                                          |
| `paginationQuerySchema`, `parsePagination`, `paginated`, `paginatedSchema`      | 1-based page, default limit 20, maximum 100; `{ items, total, page, limit, totalPages }` matches frontend `items`/`total` expectations                                  |
| `objectIdSchema`                                                                | Validate 24 hexadecimal characters before constructing a database ID                                                                                                    |

`/upload` exports `sanitizeFileName`, `buildObjectKey(scope, ownerId, fileName)`, `validateUpload(request, rules)` and
`createUploadService(config, rules)` with `presignPut`, `presignGet`, `head`, `remove`. Local signatures and command
doubles are checked against the real package; no remote bucket is accessed or verified here.

### Runtime defaults and security boundaries

- `API_PREFIX=/api` matches the frontend API URL and default Better Auth `/api/auth` path; health probes remain at the root even when the API prefix changes. Auth endpoints retain Better Auth's own protocol rather than the application envelope.
- Better Auth owns both session-cookie and Bearer validation. Its role field is server-controlled (`input: false`). Routes check resource ownership on reads and writes, not just a global role. The example `report` action additionally requires `admin`.
- Mobile clients (`modules` includes `mobile`, the default): set `MOBILE_APP_SCHEME` (the Expo `scheme`) to enable the Better Auth `expo()` plugin and trust `<scheme>://`. In development, `exp://` and `exp://**` are also trusted for Expo Go. Without the variable, neither is enabled. `advanced.disableOriginCheck: false` is explicit, because Better Auth skips origin and callbackURL checks when `NODE_ENV=test`. Without it, the fixture tests would not exercise CSRF/origin protection. `checks/mobile-auth.check.ts` covers the trusted scheme (cookie session works on the API) and rejects an untrusted scheme with 403.
- CRUD lists accept optional literal, case-insensitive `search`; database regex metacharacters are escaped. Responses keep metadata at the same level as `items`, so React, RN and Svelte pagination can read `total` directly.
- DB startup is nonfatal; readiness retries the connection and native index setup. The test helper uses an isolated MongoMemoryServer, synthetic users, and `inject`; real authentication checks additionally run the generated Better Auth adapter against the ephemeral database.
- CORS uses the explicit allowlist and credentials; browser preflights include PATCH/DELETE. Empty optional R2 settings (`uploads` module) are treated as absent; partial credential groups fail startup. Production docs are disabled.

### Verification

From the repository root with Node 24:

```sh
node packages/gen/test/fastify/verify.mjs
node packages/gen/test/fastify/verify.mjs --db=mongodb-native
node packages/gen/test/fastify/verify.mjs --modules=none
node packages/gen/test/fastify/verify.mjs --db=mongoose --update-examples
```

`--modules=none` generates with `"modules": []`, drops the mobile/R2 checks and the `@better-auth/expo` dependency from the consumer, and adds `fastify-no-modules/modules.check.ts`. Each run copies the committed fixture into a new temporary directory, generates every kind plus a multiword resource, installs real framework/database dependencies without a lockfile, typechecks and executes the generated tests plus contract checks. Mongo binaries are downloaded on demand; set `MONGOMS_DOWNLOAD_DIR` to reuse a local cache. CI runs a matrix for both DB variants. `--update-examples` copies checked output into `examples/fastify/<db>/`; examples omit fixture stubs and dependencies and are review artifacts, not standalone production apps.

## Application identity

All frameworks accept `identity: { "name": "acme-portal", "title": "Acme Portal" }` in `alot.config.json`. Name is lowercase kebab-case; title accepts letters, digits, spaces and `. , : ( ) + -`. Init templates use `__app-slug__` for the database example and `__app-title__` for OpenAPI/i18n display names; without identity they retain the `app`/`App` defaults. Source generation and editor snippets apply the same identity. Resource-like kinds using plural tokens reject ambiguous trailing-s base names (e.g. `Contacts`) before writing: use `Contact`, or supply `--plural` to resolve the ambiguity explicitly. Singular `Address`, `Status` and similar names remain valid. This is a guard, not a full natural-language inflector; use `--plural` for irregular or non-English words.

## OpenAPI contracts command (unreleased source capability)

```sh
alot-gen api-contracts --input ./openapi.json
alot-gen api-contracts --input https://api.example.test/docs/json --output src/types/main-api-types.ts
alot-gen api-contracts --input ./openapi.json --check
```

This asynchronous command also accepts YAML and writes OpenAPI `paths`/`components` plus named schema aliases (`Order` → `TOrder`, `CreateOrderRequest` → `TCreateOrderRequest`). Give API schemas stable component names matching the task kinds' contracts; the command does not infer request/response semantics. It uses the [openapi-typescript Node API](https://openapi-ts.dev/node). It reads no app secrets and refuses output paths outside the project. Existing hand-written files require an explicit `--force`; previously generated files may be regenerated. `--check` writes nothing and compares the parsed contract tokens: whitespace, quote style and optional semicolons may be formatted by the consumer, while type/structure changes or malformed output fail. Missing output also fails. Library callers can await `generateApiContracts`.

openapi-typescript 7.13.0 requires the TypeScript 5 compiler API. Gen owns exact dependencies on that library and TypeScript 5.9.3; pnpm resolves its compiler separately from the workspace/application TypeScript 7. The application stays on its existing compiler. Do not run openapi-typescript against a TypeScript 7 peer and assume compatibility. The registry gen 0.1.0 does not yet contain this command: use an authorized built/packed artifact during development, and release it explicitly before advertising it to registry-only consumers.

## Dependency lifecycle policy

Consumer roots using pnpm with `allowBuilds` support should declare an explicit policy, e.g. `esbuild: true` (platform binary installation/validation) and `mongodb-memory-server: false` (prefetch disabled, Mongo downloads at test startup). This is a map of reviewed packages, not a blanket allow or deny. Root policy belongs to the consuming workspace; source-only generation cannot silently configure a parent workspace. See [pnpm build settings](https://pnpm.io/settings#allowbuilds). Install and exercise the real generated consumer to verify the choices. The React verifier enables Biome organizeImports, so generated imports are checked after placeholder expansion rather than merely linting raw templates.

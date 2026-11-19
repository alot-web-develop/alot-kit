# Generated SvelteKit example

Generated from every Svelte kind using `Order`, `Orders`, feature `orders`, and entity `Order`. `preferencesStore.svelte.ts` demonstrates `store --persisted`; `orderStore.svelte.ts` is the ordinary variant.

Refresh and verify from the repository root:

```sh
node packages/gen/test/svelte/verify.mjs --update-examples
```

See `../../test/fixtures/svelte/README.md` for the pinned dependencies, scratch installation and verification details. This source uses the proposed kit contracts documented in `../../TEMPLATES.md`; the kit packages themselves are still scaffolds.

Application routes are `/orders`, `/orders/[id]`, `/orders/new`, and `/login`. The `(protected)` layout redirects unauthenticated requests and applies the component guard. Actions also check their own session because a layout alone does not guard child server actions. The login route uses the default email/password adapter. Configure a real Better Auth backend at `PUBLIC_API_URL` with email/password auth and the JWT plugin, matching cookie/trusted-origin settings and a backend that validates its JWTs. The frontend does not create a backend or seed users.

The list API contract is `{ items, total }`, with `page`, `limit`, `search`, and optional `status: 'active' | 'archived'`. Change these domain fields alongside the API types when adapting the template to an actual feature.

Replace `authAdapter` in `lib/auth.ts` and `serverAuthAdapter` in `lib/auth.server.ts` to change auth providers. Keep server calls scoped to their request. Feature locale modules register automatically through the i18n glob; add matching keys to both locales. Instantiate runes stores per component or context rather than using a shared server module singleton. Construct persisted stores during component setup; they restore storage after mount to preserve SSR hydration.

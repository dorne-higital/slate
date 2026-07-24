# Slate

A multi-tenant, self-hosted CMS for running multiple client sites from one deployment. Built as a Yarn workspace with two packages:

- **`layers/cms-core`** — a Nuxt Layer with the entire reusable CMS engine: components, composables, server API routes, types, layouts, pages, DB migration. This is what a brand-new client/instance project would `extends: ['@slate/cms-core']` to get the whole dashboard for free.
- **`app`** — the consuming Nuxt 4 application. Thin by design: it just extends `cms-core` and holds instance-specific config (env vars, branding overrides).

## Setup

**Requires Node 22+** (pinned in `.nvmrc` / `engines`). The ESLint/Stylelint toolchain needs `Object.groupBy`, added in Node 21 — Node 20 will crash `eslint` with `TypeError: Object.groupBy is not a function`.

```bash
corepack enable
nvm use            # or: nvm install 22
yarn install        # also runs `nuxt prepare` for app/ via postinstall
```

### Environment variables

Copy `app/.env.example` to **`app/.env`** — not the workspace root. Nuxt/Nitro only reads `.env` from the app's own root directory (where `nuxt.config.ts` lives and where `yarn workspace @slate/app dev` runs), so a `.env` at the repo root is silently ignored.

```
SUPABASE_URL=...
SUPABASE_KEY=...                  # anon/public key
SUPABASE_SERVICE_ROLE_KEY=...     # only for migration tooling / future admin scripts, never used in request-serving routes
```

### Database

Run the migration against your Supabase project:

```bash
yarn dlx supabase login
yarn dlx supabase link --project-ref <your-project-ref>
yarn dlx supabase db push
```

(or paste `layers/cms-core/supabase/migrations/0001_init.sql` into the Supabase SQL Editor). This creates all tables, RLS policies, and seeds three starter block types (Hero, Rich Text, CTA).

**Promoting the first platform admin** is deliberately not exposed anywhere in the app — there's no UI or API path to self-escalate to `is_platform_admin`. Do it once, directly, after your first user signs up:

```sql
update public.profiles set is_platform_admin = true where email = 'you@yourcompany.com';
```

### Running it

```bash
yarn dev             # app/ on localhost:3000
yarn lint             # eslint + stylelint
yarn typecheck
yarn build
```

## Access control model, in plain terms

Two tiers, enforced twice — once at the database and once in the app:

1. **Platform admin** (`profiles.is_platform_admin = true`) — sees every site. Lands on `/admin`, a list of all sites platform-wide.
2. **Site member** — a row in `site_members(user_id, site_id, role)` is the *only* thing that grants visibility into a site. No membership row, no access — not hidden in the UI, actually unqueryable. Roles are `owner > admin > editor > viewer`, ranked in that order for permission checks.

**Row Level Security is the real boundary.** Every table has RLS enabled, and every policy branches on the same two SQL helper functions the app uses too:

- `is_platform_admin()` — bypasses site-scoping entirely.
- `has_site_role(site_id, min_role)` — true if the caller is a platform admin, or holds at least `min_role` on that site via `site_members`.

**`requireSiteAccess(event, siteId, minRole)`** (`layers/cms-core/server/utils/requireSiteAccess.ts`) is the second line of defense, called at the top of every Nitro API route that touches a specific site. It calls those *same* SQL functions through the request's own RLS-scoped Supabase client (not a service-role client), so the app-layer check and the database-layer policy can never drift apart — there's exactly one definition of "who can access this site," not two that need to be kept in sync by hand.

Nothing in the app ever uses the service-role key to serve a user request. It's documented in `app/.env.example` as migration-tooling-only.

## Where the RLS policies most need a second look

These are deliberate calls, flagged inline in `layers/cms-core/supabase/migrations/0001_init.sql` as `SECOND LOOK` comments — revisit them against your actual product requirements:

- **Only platform admins can create sites** (`sites_insert`). Site owners can't self-serve a new site in this pass.
- **Only platform admins can delete a site** (`sites_delete`) — even a site's own `owner` role can't, since deletion cascades to pages and memberships.
- **Membership writes require `owner`, not `admin`** (`site_members_insert`/`update`) — an `admin` member can't promote themselves (or anyone) to `owner`, or remove the owner. Platform admins always bypass.
- **`profiles.is_platform_admin` has no update path at all**, not even a `WITH CHECK` guard — the column is excluded from the `authenticated` role's column-level `UPDATE` grant entirely, so there's no query shape that can touch it. Promotion is a manual, service-role SQL statement (see above).
- **Pages: `editor` and above can write, `viewer` is read-only.**
- **`component_registry` is global** (not site-scoped) — any authenticated user can read it (needed to render the page builder), only platform admins can write new block types.

## What's real vs. scaffolded-but-unverified

**Verified working**, against this repo's actual toolchain (not just "should work"):

- `yarn install`, `yarn lint` (ESLint + Stylelint), `yarn typecheck`, and `yarn build` all pass clean.
- The dev server boots against a real Supabase project and server-renders `/login` correctly.
- The auth redirect middleware works end-to-end: unauthenticated requests to `/` and `/admin` correctly redirect to `/login?redirect=...`.
- A real bug was caught and fixed this way: Nuxt prefixes auto-imported component names with their subfolder by default (`components/admin/StatTile.vue` → `<AdminStatTile>`, not `<StatTile>`). Every template here uses bare names, so `layers/cms-core/nuxt.config.ts` explicitly sets `pathPrefix: false` for the layer's component scan.

**Not yet verified** — the database migration has not been run against a live project as part of this build, so nothing that depends on real rows has been exercised end-to-end:

- No authenticated session was tested, so `/admin`, `/sites/[siteId]`, the Pages tree, and the page-builder canvas have not been click-tested against real data — only confirmed to compile, typecheck, and (for the parts reachable while logged out) render.
- The RLS policies have been reasoned through carefully (see above) but not run against adversarial test cases (e.g., a logged-in `viewer` attempting a write, a member of site A requesting site B's data). Write a couple of policy tests before trusting this in production.
- `vuedraggable` reordering, the schema-driven side panel, and the draft/published toggle are implemented but only reviewed, not interacted with in a browser.
- Rich Text is a plain sanitized `<textarea>`, not a real WYSIWYG editor — sanitization (via `isomorphic-dompurify`) is real and tested logically, but there's no editor UI beyond raw HTML entry yet.
- Image fields are a raw URL input — there's no upload/asset-storage flow.
- "New site" creation asks for the owner's raw Supabase user ID (find it in Auth → Users) rather than looking them up by email, to avoid adding a service-role code path for this first pass.

## Tooling notes

- **Yarn Berry** (`node-modules` linker, no PnP) — `packageManager` is pinned in root `package.json`.
- **Stylelint 17 / `@stylistic/stylelint-plugin`** — Stylelint removed formatting rules like `indentation` as core rules in v16; the 4-space rule now lives in `@stylistic/stylelint-plugin`'s `@stylistic/indentation`.
- **ESLint 10** — required by the currently-resolved `@nuxt/eslint`; ESLint 9 will fail peer resolution.
- **SCSS variables/mixins** (`layers/cms-core/assets/styles/_variables.scss`, `_mixins.scss`) are auto-injected into every `<style lang="scss">` block via Vite's `additionalData` — no manual `@use` needed in components. Note that `_mixins.scss` still needs its own `@use 'variables'` internally: Sass's `@use` scope is per-file, so a mixin's *body* resolves variables from where it's defined, not from the caller's injected scope.
- `@nuxtjs/seo`'s OG-image submodule is disabled (`ogImage: false`) — it pulls in a native rendering dependency (`@takumi-rs/core` or similar) that's pointless for an authenticated, noindexed dashboard.

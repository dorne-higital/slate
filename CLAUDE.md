# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Slate is a multi-tenant, self-hosted CMS for running multiple client sites from one deployment, built as a Yarn workspace with two packages:

- **`layers/cms-core`** — a Nuxt Layer containing the entire reusable CMS engine: components, composables, server API routes, types, layouts, pages, DB migrations. All real code lives here.
- **`app`** — the consuming Nuxt 4 application. Deliberately thin: it just does `extends: ['@slate/cms-core']` and holds instance-specific config (env vars, branding overrides). Don't add CMS features here — they belong in `cms-core`.

Backend is Supabase (Postgres + RLS + Auth + Storage). No separate backend service.

## Commands

```bash
corepack enable && nvm use && yarn install   # setup — requires Node 22+ (see engines/.nvmrc)
yarn dev                                      # app/ on localhost:3000
yarn lint                                     # eslint + stylelint
yarn lint:js / yarn lint:js:fix
yarn lint:css / yarn lint:css:fix
yarn typecheck                                # vue-tsc via nuxt typecheck
yarn build
```

There is no test suite in this repo yet — don't invent test commands.

Env vars go in **`app/.env`**, not the repo root — Nitro only reads `.env` from the app's own root. Copy from `app/.env.example`. `SUPABASE_SERVICE_ROLE_KEY` is migration-tooling-only; never reference it from request-serving code.

Database changes are plain numbered SQL files in `layers/cms-core/supabase/migrations/` (e.g. `0007_site_theme.sql`), applied via `yarn dlx supabase db push` or pasted into the Supabase SQL editor. Add new ones as the next number in sequence — there's no ORM/ODM layer generating these.

## Access control model (read before touching anything permission-related)

Two tiers, enforced **twice** — database and app — and the two must never be allowed to drift apart:

1. **Platform admin** (`profiles.is_platform_admin = true`) — sees every site, lands on `/admin`.
2. **Site member** — a row in `site_members(user_id, site_id, role)` is the *only* thing granting visibility into a site. Roles rank `owner > admin > editor > viewer`.

- **RLS is the real boundary.** Every table has RLS enabled; every policy branches on `is_platform_admin()` and `has_site_role(site_id, min_role)` (SQL functions in the migrations).
- **`requireSiteAccess(event, siteId, minRole)`** (`layers/cms-core/server/utils/requireSiteAccess.ts`) is the second line of defense — call it at the top of every Nitro API route that touches a specific site, before any other Supabase call. It calls the *same* SQL functions through the request's own RLS-scoped client (never the service-role client), so app-layer and DB-layer checks share one definition instead of two that could go out of sync.
- **`useCurrentAccess()`** (composable) is UX-only (redirects, nav) — never treat it as a security boundary; it's always re-checked server-side.
- `middleware/auth.global.ts` similarly is a routing convenience, not a security boundary — `/admin` and `/sites/[siteId]` re-verify access via their own API calls regardless.
- Deliberate RLS decisions flagged as `SECOND LOOK` comments in `layers/cms-core/supabase/migrations/0001_init.sql` (e.g. only platform admins can create/delete sites, membership writes require `owner` not `admin`, `profiles.is_platform_admin` has no update path at all — promotion is a manual service-role SQL statement, never exposed in-app).

## Domain routing / tenant resolution

Sites are reachable via `/preview/{site-slug}/{page-path}` (works everywhere, shows drafts to logged-in members), `{slug}.localhost:3000` (dev only, same rendering path via subdomain), or a real domain (custom or wildcard `{slug}.{baseDomain}`).

Real-domain requests go through `server/middleware/resolve-tenant-domain.ts`, which resolves the tenant from the `Host` header and renders the response **in-process** via Nitro's `event.fetch` against the `/preview/{slug}/...` route — not a self-proxy over a network port (that would break on serverless hosts with no listening port to call back into). Because the inner render's route identity is genuinely `/preview/{slug}/...`, two things get corrected on top of it:

- SEO tags (`<link rel="canonical">`, `og:url`) are rebuilt in `pages/preview/[siteSlug]/[...path].vue` from the `x-slate-tenant-domain` header instead of `route.path`.
- The visible address bar is corrected client-side only, via `history.replaceState()` in `onMounted` — cosmetic only, never via `router.replace()`/`navigateTo()`, since re-triggering route resolution against the *real* browser path would resolve to the admin app's own routes instead of this page. See README.md for the full history of why simpler approaches (mutating `event._path`, blanking the hydration payload) were tried and reverted.

If you touch tenant routing, custom domains, or the preview page's SEO/hydration logic, read the "Going live: domains" section of README.md in full first — the constraints there are non-obvious and were arrived at by trial and error.

## Block / page-builder system

- Pages (`Page` type, `layers/cms-core/types/index.ts`) store an ordered array of `Block { id, type, props }` directly in a JSONB column — no separate blocks table.
- `component_registry` (global, not site-scoped) is the DB-backed catalog of block *types* — each row has a `schema: BlockFieldSchema[]` describing its editable fields (kind: text/textarea/richtext/image/url/select/boolean/number). Any authenticated user can read it (needed to render the page builder); only platform admins can write new block types.
- `utils/blockComponents.ts` maps a block's `type` string to a Vue component name, shared by `BlockRenderer.vue` (public/preview rendering) and `PageBuilderCanvas.vue` (editor rendering) so the two never diverge. Block components live in `components/blocks/`.
- Because blocks are resolved dynamically via `<component :is="someString">` rather than literal template tags, the layer's component registration in `nuxt.config.ts` uses `global: true` — without it the runtime string never resolves and silently renders an unknown element instead of the block.
- Rich Text is currently a sanitized (`isomorphic-dompurify`) `<textarea>`, not a WYSIWYG editor.

## Site theming

`Site.theme: SiteTheme | null` (`layers/cms-core/types/index.ts`) is a full design-token system — colors, radius, shadows, typography, spacing — where every field is optional and an unset field means "use the built-in default," never "use empty/invalid." `layers/cms-core/utils/siteTheme.ts` is canonical for the field list, CSS variable names, grouping, and defaults; `siteThemePresets.ts` and `siteFonts.ts` supply preset palettes and Google Font options. Page-builder rendering inherits these as CSS custom properties rather than each block hardcoding colors.

## Conventions specific to this repo

- **Components use bare tag names**, not Nuxt's directory-prefixed default (`components/admin/StatTile.vue` → `<StatTile>`, not `<AdminStatTile>`) — enforced via `pathPrefix: false` in `layers/cms-core/nuxt.config.ts`. Keep new components consistent with this.
- **Style**: 4-space indent, single quotes, no semicolons, no trailing commas (see `eslint.config.mjs`). SCSS: alphabetical property order, 4-space indent (`.stylelintrc.json`).
- `layers/cms-core/assets/styles/_variables.scss` and `_mixins.scss` are auto-injected into every `<style lang="scss">` block via Vite's `additionalData` — don't add manual `@use` for these two in components. Note `_mixins.scss` still needs its own internal `@use 'variables'` — Sass `@use` scope is per-file, so a mixin body resolves against its own definition site, not the caller's injected scope.
- Root `eslint.config.mjs` builds on `app/.nuxt/eslint.config.mjs`, which is generated by `nuxt prepare` (wired to the root `postinstall`) and knows about auto-imports/components across both workspaces — if lint seems to be missing auto-imports, `yarn install` (or `yarn workspace @slate/app prepare`) regenerates it.
- Nothing in the app should ever use the Supabase service-role key to serve a user request — it's for migration/admin tooling only.

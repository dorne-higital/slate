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
SUPABASE_URL=...                  # not secret — ships in the client bundle either way
SUPABASE_KEY=...                  # anon/public key — also not secret, safety comes from RLS, not from hiding this
SUPABASE_SERVICE_ROLE_KEY=...     # SECRET. Bypasses RLS entirely. Only for migration tooling / one-off admin scripts —
                                   # never referenced by request-serving routes, so don't set this on your deploy target at all.
NUXT_BASE_DOMAIN=                 # optional, see "Going live: domains" below
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

## Going live: domains

Every site can be reached three ways, in increasing order of "real":

1. **`/preview/{site-slug}/{page-path}`** — works everywhere, no setup. Nested pages just extend the path (`/preview/portfolio/about`). A site's sidebar has a "Preview site ↗" link straight to this.
2. **`{site-slug}.localhost:3000`** — local dev only. Browsers resolve any `*.localhost` address to your own machine automatically (RFC 6761), no `/etc/hosts` editing needed. Same rendering path as `/preview/...`, just reached via subdomain instead of a URL prefix — useful for testing how subdomain-style URLs will actually behave.
3. **A real domain** — either a fully custom domain per site (below), or a free `{slug}.` subdomain of a domain *you* own (further below). Both go through `server/middleware/resolve-tenant-domain.ts`, which checks the incoming request's `Host` header on every request and transparently serves that site's content — the visitor's address bar never changes, they just silently get the site instead of the admin dashboard.

The domain-routing middleware resolves the tenant and renders its response entirely **in-process**, via Nitro's `event.fetch` (see `resolve-tenant-domain.ts`) — not by the server dialing itself over a network port. An earlier version used a real HTTP self-proxy, which worked locally but would have quietly broken on any serverless host (Netlify Functions, Vercel) where a single invocation has no listening port to call back into. `event.fetch` never opens a socket at all, so this holds regardless of hosting platform — confirmed by running it with the server's actual listening port deliberately mismatched from what the code was told, which still worked.

That inner request genuinely renders the `/preview/{slug}/{page-path}` page — that's the only way to make Nuxt route a custom-domain request to different content than `/`, `/login`, etc. would normally resolve to. Left alone, that page's own route identity (`/preview/{slug}/...`) leaks into two places: the SEO `<link rel="canonical">`/`og:url` tags, and the browser's address bar.

The SEO tags are fixed in the page itself (`pages/preview/[siteSlug]/[...path].vue`), by rebuilding them from the `x-slate-tenant-domain` header instead of `route.path`. The address bar is fixed there too, but more carefully: Vue Router's hydration (`nuxt/dist/pages/runtime/plugins/router.js`) deliberately re-syncs its client-side route to match whatever the server actually rendered — on mount it does `router.replace(resolvedInitialRoute)`, where `resolvedInitialRoute` comes from the hydration payload's `path` field (genuinely `/preview/{slug}/...`). That sync exists to keep hydration consistent, and matters: an earlier version of this fix blanked that payload field out to stop the address-bar leak, which broke hydration instead — Vue Router then resolved the *real* browser path (`/`) against the route table, which matches `pages/index.vue` (the admin app's own root), not this page, so real visitors got a flash of site content immediately replaced by a redirect to `/login`. So the payload/router-state is left alone, and the address bar is corrected purely cosmetically instead, client-side only, via `history.replaceState()` in `onMounted` — that changes what's *displayed* without going through `router.replace()`/`navigateTo()`, so it never re-triggers route resolution. (There's a brief, sub-frame history-entry correction from Vue Router's own sync before this runs — not a real navigation or content flash, just an internal history-stack entry — verified via Playwright: correct final URL, correct content, no hydration-mismatch warnings, no login redirect.)

Direct mutation of `event._path`/`event.node.req.url` (to avoid the inner render and this whole class of leak) was tried first and reverted — it broke the auth guard's routing (redirected to `/login`) even though `event.path` itself read back correctly, since Nitro's own request dispatch resolves which handler to run before this middleware gets a chance to change it.

### Custom domain per site

Site dashboard → **Settings** → Custom domain. Once set, any request arriving with that hostname gets served that site's content automatically — no further app-side config, on any host.

### Deploying to Vercel

**Repo side — already done, documented here so it isn't re-discovered the hard way:**

- `app/package.json` explicitly depends on `"@slate/cms-core": "workspace:*"` and declares `"engines": {"node": ">=22"}`. Both matter specifically for Vercel: its monorepo dependency-graph detection requires workspace dependencies to be *stated*, not just implied by `extends: [...]` in `nuxt.config.ts`; the `engines` field is a fallback path to the right Node version alongside picking it explicitly in Project Settings (below).
- No `vercel.json` needed — Nitro auto-detects the Vercel build environment and produces Vercel's expected serverless output format on its own.

**Vercel project setup:**

1. Import the repo as a new Vercel project.
2. **Root Directory**: `app` (Project Settings → Build and Deployment → Root Directory → Edit → select `app`). Framework Preset should auto-detect as **Nuxt.js** once this is set.
3. **Node.js Version**: Build and Deployment → Node.js Version → **22.x**.
4. **Environment variables** (Project Settings → Environment Variables):
   - `ENABLE_EXPERIMENTAL_COREPACK=1` — **required**, not optional. Without it, Vercel ignores the `packageManager` field entirely and installs with plain Yarn 1 just because it sees a `yarn.lock`, which silently breaks — `.yarnrc.yml` and `nodeLinker: node-modules` only mean anything to Yarn Berry.
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `NUXT_BASE_DOMAIN` — once you've done the wildcard DNS/cert setup below.
5. Deploy, then confirm `/login` loads before touching DNS.

**If the build fails trying to resolve `@slate/cms-core` or reach anything under `layers/`:** Vercel restricts a project to files inside its Root Directory by default; genuine workspace monorepos (which this is, per the dependency declared above) are meant to be exempted from that automatically, but if it still trips, look for a monorepo/"include files outside the Root Directory" option in the project's settings and enable it.

**Wildcard subdomains per site, on Vercel:** gives every site a free `{slug}.{your-domain}` URL automatically, the same way `{slug}.localhost` already works in dev. Wildcard domains are supported on **every Vercel plan including the free Hobby tier** (this was the whole reason for choosing Vercel over paying for Netlify Pro) — you just need Vercel managing DNS for the certificate challenge:

1. Own a real domain — e.g. `slatecms.co.uk`.
2. In Vercel, add the domain to your project, then follow its prompt to delegate the domain's **nameservers to Vercel** (find the exact nameservers under the domain's DNS settings once added).
3. At your registrar (Hostinger, in this case) — change `slatecms.co.uk`'s nameservers to Vercel's. No need to move registration, just the nameservers. Allow up to 24 hours to propagate.
4. Add `*.slatecms.co.uk` as a wildcard domain on the same project.
5. Once its certificate shows active, set `NUXT_BASE_DOMAIN=slatecms.co.uk` and redeploy.

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
- ~~Image fields are a raw URL input~~ — superseded: there's now a real media library (Supabase Storage bucket + `media` table, RLS-scoped per site) with an image picker modal in the block settings panel.
- ~~"New site" creation asks for the owner's raw Supabase user ID~~ — superseded: it's a dropdown of existing users now (`GET /api/admin/users`, platform-admin only — see `layers/cms-core/server/api/admin/users.get.ts`). Still can't invite someone who hasn't signed up yet.

This list reflects the very first pass and hasn't been kept current since — treat it as historical, not authoritative, for anything not cross-checked against the actual code.

## Tooling notes

- **Yarn Berry** (`node-modules` linker, no PnP) — `packageManager` is pinned in root `package.json`.
- **Stylelint 17 / `@stylistic/stylelint-plugin`** — Stylelint removed formatting rules like `indentation` as core rules in v16; the 4-space rule now lives in `@stylistic/stylelint-plugin`'s `@stylistic/indentation`.
- **ESLint 10** — required by the currently-resolved `@nuxt/eslint`; ESLint 9 will fail peer resolution.
- **SCSS variables/mixins** (`layers/cms-core/assets/styles/_variables.scss`, `_mixins.scss`) are auto-injected into every `<style lang="scss">` block via Vite's `additionalData` — no manual `@use` needed in components. Note that `_mixins.scss` still needs its own `@use 'variables'` internally: Sass's `@use` scope is per-file, so a mixin's *body* resolves variables from where it's defined, not from the caller's injected scope.
- `@nuxtjs/seo`'s OG-image submodule is disabled (`ogImage: false`) — it pulls in a native rendering dependency (`@takumi-rs/core` or similar) that's pointless for an authenticated, noindexed dashboard.

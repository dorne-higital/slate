# CLAUDE.md

Slate is a multi-tenant website builder/CMS: one deployment serves Slate's own marketing site, the CMS, and every client site. Rebuilt from scratch in Nov 2026 (old Supabase/Vercel version lives in git history on `main` before the `rebuild` branch).

## Stack

- **Nuxt 4** single app (`app/` = frontend, `server/` = Nitro API, `shared/` = code used by both, auto-imported)
- **Cloudflare Workers** hosting (`nitro.preset: 'cloudflare_module'`, `wrangler.jsonc`). Custom client domains via Cloudflare for SaaS.
- **Neon Postgres** (London, eu-west-2) via Drizzle ORM over Neon's HTTP driver (`server/utils/db.ts`). No interactive transactions on this driver — use `db.batch([...])`.
- **Better Auth** (email + password) in `server/utils/auth.ts`, endpoints at `/api/auth/*`.
- Designs: the "Slate — site and CMS redesign" canvas artifact (https://claude.ai/artifact/6iSQ4irmSJSQ9vXm2ap5fG). Brand tokens are in `app/assets/css/main.css`.

## Commands

```bash
yarn install
yarn dev            # local dev (reads .env at repo root)
yarn typecheck
yarn db:generate    # after editing db/schema.ts → new SQL in db/migrations
yarn db:migrate     # apply migrations to the local "dev" Neon branch
yarn db:migrate:prod  # apply them to the live database — do this before deploying code that needs them
yarn preview        # build + run in the real Workers runtime (wrangler dev)
yarn deploy         # build + deploy to Cloudflare
```

No test suite yet — don't invent test commands.

## Databases

Local `.env` points at Neon's **dev** branch (a copy of production), so local testing never touches live data. The live database is only reached through `PROD_DATABASE_URL_UNPOOLED` by `yarn db:migrate:prod`. The Worker's own `NUXT_DATABASE_URL` secret points at production.

## Access control

- A `site_members(site_id, user_id, role)` row is the only thing granting access to a site. Roles: `owner > admin > editor > viewer` (`ROLE_RANK` in `shared/types`).
- `user.is_platform_admin` sees everything. It is never settable from the app (`input: false` in Better Auth); promote with a manual SQL UPDATE.
- **Every API route touching a site calls `requireSiteAccess(event, siteId, minRole)` first.** It answers 404 for sites you can't see. There's no RLS in this version, so this check is the boundary — never query site data without it.
- `useMe()` / `middleware/auth.ts` are UX only.
- `server/middleware/same-origin.ts` rejects state-changing `/api/` requests from any origin but Slate's own (client subdomains are same-site with slatecms.co.uk). `/api/public/*` is exempt.
- Platform plan and status of every feature: `docs/plan.md`.

## Tenant routing

`app/router.options.ts` picks the route set by hostname: Slate's own host (`NUXT_PUBLIC_APP_HOST`, or any `localhost`) gets everything except `pages/_site`; any other host gets only `pages/_site`, mounted at `/`. `server/utils/tenant.ts` maps a host to a site (`{slug}.{sitesDomain}` or `sites.custom_domain`). Locally, `{slug}.localhost:3001` shows a client site.

## Conventions

- 4-space indent, single quotes, no semicolons, no trailing commas.
- Components use bare names (`pathPrefix: false`).
- Pages store blocks as JSONB: `blocks` (draft) and `published_blocks` (live). Publishing copies one to the other.
- Block components live in `app/components/blocks/`, registered in `BlockRenderer.vue`.
- Copy follows the brand sheet: plain words, sentence case, no exclamation marks, errors say what to do next.

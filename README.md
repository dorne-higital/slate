# Slate

Slate is a website builder and CMS for small businesses. One deployment serves three things:

- **slatecms.co.uk** — Slate's marketing site, sign-up and the CMS (`/sites/...`) and platform admin (`/admin`)
- **{slug}.slatecms.co.uk** — every client site's free address
- **client domains** (e.g. brambleandoak.co.uk) — connected or bought through Slate

Rebuilt from scratch in November 2026 on the `rebuild` branch. The old Supabase/Vercel version is in git history on `main`. More detail for developers is in `CLAUDE.md`; the feature plan and its status is in `docs/plan.md`.

> **No secrets in this file.** Keys live in `.env` (local, never committed) and in Cloudflare Worker secrets (live). This README says what each one is and where to get a new one.

---

## Services and accounts

| Service | Used for | Where to manage it | Cost |
|---|---|---|---|
| **Cloudflare** (account `814d73a9843cc80a1c1c1918ba90ad38`) | Hosting (Workers), DNS for slatecms.co.uk, client custom domains (Cloudflare for SaaS), file storage (R2) | https://dash.cloudflare.com | Workers paid plan ~$5/mo recommended; Cloudflare for SaaS: 100 domains free then $0.10 each/mo; R2: 10 GB free |
| **Neon** (project `purple-truth-16268921`, London eu-west-2) | Postgres database | https://console.neon.tech | Free tier |
| **Stripe** | Plan subscriptions, domain payments, customer portal, invoices | https://dashboard.stripe.com | 1.5% + 20p per UK card payment |
| **name.com** | Registering domains customers buy | https://www.name.com/account | Wholesale price per domain, paid from the name.com account balance |
| **Resend** | Sending email from hello@slatecms.co.uk | https://resend.com | Free up to 3,000 emails/month |
| **GitHub** | Code (`rebuild` branch) | — | Free |
| **Domain registrar for slatecms.co.uk** | Hostinger (nameservers point at Cloudflare) | https://hpanel.hostinger.com | Yearly renewal |

### Cloudflare in detail

- **Worker** `slate` — the whole app. Config in `wrangler.jsonc`. Deploy with `yarn deploy`.
- **Routes**: `slatecms.co.uk/*`, `*.slatecms.co.uk/*`, and `*/*` (catches client custom domains).
- **DNS** (zone `04820b9bf2258b595f63d96ac643e6a5`):
  - `slatecms.co.uk`, `www`, `*` — `AAAA 100::`, proxied (placeholders; the Worker answers)
  - `sites.slatecms.co.uk` — `AAAA 100::`, proxied. **Fallback origin for client domains**: clients point their domain at this
  - `resend._domainkey`, `send` (MX + TXT), `rsend` (CNAME) — Resend email sending, DNS only
  - `_dmarc` — `v=DMARC1; p=none;`
  - CAA records for sectigo, pki.goog, letsencrypt
- **Cloudflare for SaaS** (SSL/TLS → Custom Hostnames): each client domain (and its `www`) is added through the API when connected. HTTP validation.
- **R2 buckets**: `slate-media` (live), `slate-media-preview` (unused locally). Bound to the Worker as `MEDIA`.
- **Turnstile** (Cloudflare dashboard → Turnstile): one widget for `slatecms.co.uk`, mode Managed. Site key is public (wrangler var), secret is a Worker secret. Local testing uses Cloudflare's test keys (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`).
- **Cron triggers**: `0 3 * * *` purge deleted sites (30 days) and old error logs, `0 9 * * *` trial-ending reminder emails, `0 2 * * 1,4` database backup.
- **API token** (`NUXT_CLOUDFLARE_API_TOKEN`): needs Zone → SSL and Certificates: Edit, and DNS: Edit on slatecms.co.uk. Create a new one at My Profile → API Tokens.

### Neon in detail

- Branch **`production`** — live data. The Worker's `NUXT_DATABASE_URL` points here.
- Branch **`dev`** — a copy for local development. Local `.env` points here so testing never touches live data.
- Migrations: `yarn db:migrate` (dev) and `yarn db:migrate:prod` (live, uses `PROD_DATABASE_URL_UNPOOLED`). **Run the live one before deploying code that needs it.**
- To refresh dev from live: in the Neon console, reset the `dev` branch from its parent.

### Stripe in detail

- **Live since 24 Nov 2026** with a restricted key (`rk_live_…`, Worker secret `NUXT_STRIPE_SECRET_KEY`; a copy is `STRIPE_LIVE_SECRET_KEY` in `.env`). Local development still uses the test key (`STRIPE_SECRET_KEY`). Test card for test mode: 4242 4242 4242 4242, any future date, any CVC.
- The restricted key needs write access to: customers, checkout sessions, billing portal sessions and configurations, products, prices, subscriptions and subscription items, invoices and invoice items, coupons, promotion codes, webhook endpoints.
- Products/prices: `slate_starter`, `slate_business`, `slate_studio`, each with `_monthly` and `_yearly` lookup keys. Created by `yarn stripe:setup` from `shared/utils/plans.ts`.
- `slate_extra_site` (£6/mo, £60/yr): added to a Studio subscription automatically for each site beyond the 5 included, and removed when sites are deleted.
- Customer portal configuration: id in `wrangler.jsonc` (`NUXT_STRIPE_PORTAL_CONFIG`).
- Webhook: `https://slatecms.co.uk/api/stripe/webhook` (checkout completed, subscription created/updated/deleted). Its signing secret is the Worker secret `NUXT_STRIPE_WEBHOOK_SECRET`.
- Domain purchases are yearly subscriptions tagged `kind=domain`.

### name.com in detail

- API user + token from Account → Settings → API (https://www.name.com/account/settings/api).
- Availability checks always use the real API (read only).
- **Real registrations only happen when Stripe uses a live key.** In test mode, domain orders are simulated end to end.
- Before going live, put funds or a card on the name.com account: each registration is paid from it.

### Resend in detail

- Domain `slatecms.co.uk` verified (eu-west-1). Sends from `hello@slatecms.co.uk`.
- Emails: form replies, invites, password resets, trial reminders, support tickets, failed domain orders (to platform admins).
- Locally emails are **logged, not sent** (the key is stored as `RESEND_API_KEY`, which the app doesn't read). Rename it to `NUXT_RESEND_API_KEY` only if you really want local emails to go out — the dev database is a copy of live, with real customers' addresses.

---

## Keys and settings

### Live (Cloudflare Worker secrets)

Set with `npx wrangler secret put NAME` (it asks for the value). List with `npx wrangler secret list`.

| Secret | What it is |
|---|---|
| `NUXT_DATABASE_URL` | Neon **production** pooled connection string |
| `NUXT_BETTER_AUTH_SECRET` | Random string that signs login sessions. Changing it logs everyone out |
| `NUXT_CLOUDFLARE_API_TOKEN` | Cloudflare API token (custom hostnames, DNS) |
| `NUXT_STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` now, `sk_live_…` when live) |
| `NUXT_STRIPE_WEBHOOK_SECRET` | Signing secret of the Stripe webhook endpoint (`whsec_…`) |
| `NUXT_NAMECOM_USERNAME`, `NUXT_NAMECOM_TOKEN` | name.com API login |
| `NUXT_RESEND_API_KEY` | Resend API key |
| `NUXT_TURNSTILE_SECRET` | Cloudflare Turnstile secret key (bot check on sign-up, login, password reset). Not set = check switched off |

Non-secret settings are `vars` in `wrangler.jsonc` (including `NUXT_PUBLIC_TURNSTILE_SITE_KEY` once Turnstile is set up): app host, sites domain, CNAME target (`sites.slatecms.co.uk`), Cloudflare zone id, Stripe portal config id.

### Local (`.env` at the repo root, never committed)

| Variable | What it is |
|---|---|
| `NUXT_DATABASE_URL`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Neon **dev** branch |
| `PROD_DATABASE_URL_UNPOOLED` | Neon production, direct — only for `yarn db:migrate:prod` |
| `NUXT_BETTER_AUTH_SECRET` | Any long random string |
| `NUXT_PUBLIC_APP_HOST` | `localhost:3001` |
| `NUXT_PUBLIC_SITES_DOMAIN` | `localhost:3001` (client sites at `{slug}.localhost:3001`) |
| `NUXT_CLOUDFLARE_API_TOKEN`, `NUXT_CLOUDFLARE_ZONE_ID` | As live (connecting domains locally really creates Cloudflare hostnames) |
| `NUXT_STRIPE_SECRET_KEY`, `NUXT_STRIPE_PORTAL_CONFIG` | Stripe **test** key and portal config, for billing locally |
| `NUXT_STRIPE_WEBHOOK_SECRET` | Any `whsec_local_…` string (only for signing test events yourself) |
| `NUXT_NAMECOM_USERNAME`, `NUXT_NAMECOM_TOKEN` | For domain search locally |
| `STRIPE_SECRET_KEY` | Read by `yarn stripe:setup` |
| `RESEND_API_KEY` | Kept here for reference; not read by the app (see Resend above) |
| `NEON_*` | Written by the Neon CLI |

---

## Running it

```bash
yarn install
yarn dev --port 3001   # http://localhost:3001 (port 3000 is another project)
yarn typecheck
yarn db:generate       # after editing db/schema.ts
yarn db:migrate        # dev database
yarn db:migrate:prod   # live database (before deploying code that needs it)
yarn stripe:setup      # sync Stripe with shared/utils/plans.ts (safe to re-run)
yarn deploy            # build and deploy to Cloudflare
```

Local dev runs on plain Node: Cloudflare's local runtime (workerd) needs macOS 13.5+. `yarn preview` uses it if your Mac supports it. Media uploads are stored in `.data/media` locally and in R2 live.

---

## How do I…

- **Make someone a platform admin** — only by SQL on the live database: `update "user" set is_platform_admin = true where email = '…';`
- **Change prices or plan limits** — edit `shared/utils/plans.ts`, run `yarn stripe:setup`, deploy. The home page table and Billing page read from the same file, so they update too. New sign-ups get the new price; existing customers keep theirs until moved in Stripe.
- **Change domain prices or add an ending** — edit `shared/utils/domainPrices.ts` and deploy.
- **Go live with payments**
  1. Activate the Stripe account (business and bank details).
  2. Create a live secret key (shown once — copy it straight away).
  3. Run `STRIPE_SECRET_KEY=sk_live_… yarn stripe:setup --webhook https://slatecms.co.uk/api/stripe/webhook` — it creates live products, prices, portal and webhook, and prints the new portal id and webhook secret.
  4. Update the Worker secrets `NUXT_STRIPE_SECRET_KEY` and `NUXT_STRIPE_WEBHOOK_SECRET`, and `NUXT_STRIPE_PORTAL_CONFIG` in `wrangler.jsonc`. Deploy.
  5. Fund the name.com account — real domain registrations start now.
- **Rotate a leaked key** — create a new one at the service, `npx wrangler secret put NAME`, update `.env`, then delete the old key at the service.
- **Give a client a special price** — Admin → Billing (or Billing on a site in the dashboard list) → Special price. It's a Stripe price on the plan's product (metadata `slate_plan`), used at checkout and swapped onto a live subscription from the next payment. If Slate covered the site, its owner becomes the payer with a trial and starts the plan at that price from Billing.
- **Invoice a client for extra work** — Admin → Billing → New invoice. Stripe hosts the invoice and pay page; Slate emails the link. It also appears on the client's Billing page. Cancel unpaid ones from the Invoices list.
- **Make a discount code** — Admin → Billing → Discount codes (Stripe coupon + promotion code). People enter it at checkout.
- **Restore a deleted site** — within 30 days, from the admin dashboard's site list (Restore).
- **See errors on the live site** — Admin → Errors (grouped, with the stack). Platform admins are emailed the first time each kind of error appears in an hour. Raw logs: Cloudflare dashboard → Workers → slate → Logs.
- **Backups** — every Monday and Thursday at 02:00 UTC the whole database is saved as one gzipped JSON file in R2 (`slate-media` bucket, `_backups/` folder); the newest 8 are kept. Admin → Backups lists them, downloads them and can back up now. Media files aren't copied (they're already in R2).
- **Restore a backup** — make an empty database with Slate's tables (a new Neon branch, then `yarn db:migrate` against it, or a schema-only branch), then `RESTORE_DATABASE_URL=… node --experimental-strip-types scripts/restore-backup.ts slate-….json.gz` (add `--check` to just list what's inside). It refuses to write into tables that already have rows. Then point `NUXT_DATABASE_URL` at it.
- **Run the tests** — `yarn test` (quick, no server). For the end-to-end ones: `yarn dev:test` in one terminal, `yarn test:api` in another (uses the dev database and deletes its test accounts).

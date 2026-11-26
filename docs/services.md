# Services Slate runs on

Every outside account behind Slate, what it's for, and where its keys live (names only, never values).
A clickable version: https://claude.ai/artifact/JQUHE4kb38FaWHKNVzr7aD (private to Dan). Keep both up to date when a service is added.

| Service | What it does | Dashboard | Keys (local `.env` / Worker secret) |
|---|---|---|---|
| Slate admin | Accounts, sign-ups, marketing stats, support, errors, billing, backups | https://slatecms.co.uk/admin | – |
| Cloudflare | Hosting (Worker `slate`), DNS for slatecms.co.uk, client domains (Cloudflare for SaaS custom hostnames), R2 bucket `slate-media` (uploads, backups in `_backups/`), Turnstile, Web Analytics, cron jobs | https://dash.cloudflare.com | `NUXT_CLOUDFLARE_API_TOKEN`, `NUXT_CLOUDFLARE_ZONE_ID` / secrets `NUXT_CLOUDFLARE_API_TOKEN`, `NUXT_CLOUDFLARE_DOMAINS_TOKEN`; beacon token and site tag are vars in `wrangler.jsonc` |
| Neon | Postgres, London. Main branch = live; `dev` branch = local | https://console.neon.tech | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `PROD_DATABASE_URL_UNPOOLED` / `NUXT_DATABASE_URL` |
| Stripe | Plans, domain payments, receipts, customer portal, webhook `/api/stripe/webhook` | https://dashboard.stripe.com (test: /test/dashboard) | `STRIPE_SECRET_KEY` (test), `STRIPE_LIVE_SECRET_KEY` / `NUXT_STRIPE_SECRET_KEY`, `NUXT_STRIPE_WEBHOOK_SECRET` |
| name.com | Registers client domains, email forwarding | https://www.name.com/account | `NAMECOM_USERNAME`, `NAMECOM_TOKEN` / `NUXT_NAMECOM_USERNAME`, `NUXT_NAMECOM_TOKEN` |
| Resend | Sends all email | https://resend.com/emails | `RESEND_API_KEY` / `NUXT_RESEND_API_KEY` |
| Turnstile (Cloudflare) | Bot check on sign-up, login, forms | https://dash.cloudflare.com → Turnstile | `NUXT_PUBLIC_TURNSTILE_SITE_KEY`, `NUXT_TURNSTILE_SECRET` |
| Google Search Console | Search performance, sitemap | https://search.google.com/search-console | – |
| Bing Webmaster Tools | Same for Bing | https://www.bing.com/webmasters | – |
| GitHub | Code (`main` is live) | https://github.com/dorne-higital/slate | – |
| Designs | Site and CMS redesign canvas | https://claude.ai/artifact/6iSQ4irmSJSQ9vXm2ap5fG | – |

Scheduled jobs (Worker cron, `nuxt.config.ts`): 3am daily purge deleted sites; 9am daily trial reminders; 2am Mon and Thu database backup; every 10 minutes check pending domains.

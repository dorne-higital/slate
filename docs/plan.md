# Slate build plan

Working order for the rebuild. Each item: build → test locally → deploy → test live → commit, then tick it off here.
Items marked **needs Dan** are blocked on something only the account owner can do (cards, accounts, keys).

Designs: https://claude.ai/artifact/6iSQ4irmSJSQ9vXm2ap5fG

## Done

- [x] Foundation: Nuxt 4 on Cloudflare Workers, Neon + Drizzle, Better Auth
- [x] Sign-up with starting layouts, CMS overview, pages list
- [x] Page editor: 7 block types, autosave drafts, undo, publish, new pages
- [x] Theme (colours, fonts, corners, palettes) and menus (header, footer, small print)
- [x] Marketing home page
- [x] slatecms.co.uk on Cloudflare, client sites on {slug}.slatecms.co.uk
- [x] Custom domains (Cloudflare for SaaS), redirects to main domain
- [x] Platform admin: All sites page
- [x] Forms and inbox: form editor, Form block, spam protection (hidden field, timing, rate limit),
  inbox with read/done/notes, CSV export, unread badge, replies on the overview
- [x] Search and sharing: per-page search title/description/share image/hide, site defaults,
  Google preview, canonical + Open Graph tags, sitemap.xml and robots.txt per site
- [x] Blog: posts with drafts, publish, scheduling, categories, cover image, summary, address;
  public blog index, category filter, post pages, RSS, Latest posts block, Blog in auto header
- [x] Settings and people: site name, reply email, invite links with roles, change role, remove,
  leave, last-owner protection, take offline (holding page), delete with 30-day restore by platform admin
- [x] Integrations: Google Analytics, Plausible, Meta Pixel, Calendly (+ Booking block), cookie consent
  banner for GA/Meta, cross-site request protection on the CMS API. Mailchimp, Kit, Stripe: coming soon
- [x] Media library (R2): upload by button or drag and drop, file type checked from the bytes (no SVG/HTML),
  10 MB limit, alt text, search, delete; Choose image in block fields and post covers
- [x] Billing (Stripe, test mode): Starter £9 / Business £19 / Studio £39 a month, yearly = 2 months free,
  14-day trial with Business features, no card. Billed per person (Studio covers up to 10 sites).
  Checkout, customer portal, signed webhook, invoices; plan limits on pages, forms, blog, people,
  integrations and sites; sites pause publicly when a trial ends unpaid. New site / Your sites page.
  Prices live in shared/utils/plans.ts; `yarn stripe:setup` syncs Stripe.
  **To take real money:** live secret key, run `yarn stripe:setup --webhook https://slatecms.co.uk/api/stripe/webhook`
  with it, update the Worker secrets. Decide on VAT (Stripe Tax) first.

## Next, in order

1. [ ] **Domain buying** (**needs Dan: registrar reseller account**): search + buy a domain during sign-up
   and from Domains, auto-connect
2. [ ] **Email** (password reset, form reply notifications, invites): Cloudflare Email Sending or Resend

## Housekeeping (as I go)

- [x] Separate Neon branch for local development (`dev`); `yarn db:migrate:prod` for live
- Drag and drop for blocks and pages
- [x] Old Vercel DNS records removed (proxied AAAA 100:: placeholders for the Worker)
- [x] Daily job (03:00 UTC): purge sites deleted more than 30 days ago, their Cloudflare hostnames, old invites
- Site export (pages, posts, form replies) for the Settings page

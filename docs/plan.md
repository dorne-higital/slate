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

## Next, in order

1. [ ] **Search and sharing (SEO)**: per-page titles/descriptions/share image overview, site-wide defaults,
   sitemap.xml and robots.txt for client sites, canonical + Open Graph tags
2. [ ] **Blog**: posts with draft/publish/schedule, categories, blog index + post pages on client sites,
   Latest posts block, RSS feed
3. [ ] **Settings and people**: site name/details, invite people by email link, roles (owner, admin,
   editor, viewer), remove people, delete site
4. [ ] **Integrations**: Google Analytics / Plausible ID, Meta pixel, custom head snippet (owner only)
5. [ ] **Media library** (**needs Dan: enable R2**): uploads to R2, media page with grid/search,
   image picker in the editor, logo + favicon in Theme
6. [ ] **Billing** (**needs Dan: Stripe account + test keys**): plans, Stripe Checkout + customer portal,
   webhooks, plan limits, Billing page with invoices
7. [ ] **Domain buying** (**needs Dan: registrar reseller account**): search + buy a domain during sign-up
   and from Domains, auto-connect
8. [ ] **Email** (password reset, form reply notifications, invites): Cloudflare Email Sending or Resend

## Housekeeping (as I go)

- Separate Neon branch for local development so local test data never touches live
- Drag and drop for blocks and pages
- Remove old Vercel DNS records on slatecms.co.uk

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
- [x] Media library (R2): upload by button or drag and drop (done: blocks in editor incl. from library, pages list; browser check of the drag still to do), file type checked from the bytes (no SVG/HTML),
  10 MB limit, alt text, search, delete; Choose image in block fields and post covers. Drag-and-drop upload checked in the browser (25 Nov)
- [x] Billing (Stripe, test mode): Starter £15 / Business £29 / Studio £49 a month (were £9/£19/£39 until 25 Nov 2026), yearly = 2 months free.
  Since 26 Nov 2026 every plan has a blog and no Slate branding; Starter 20 pages, 3 forms, 2 people, 5 GB, Calendly; Business 100 pages, 20 forms, 5 people, 25 GB; Studio the same with 5 sites, 10 people, 50 GB.
  14-day trial with Business features, no card. Billed per person (Studio covers up to 10 sites).
  Checkout, customer portal, signed webhook, invoices; plan limits on pages, forms, blog, people,
  integrations and sites; sites pause publicly when a trial ends unpaid. New site / Your sites page.
  Prices live in shared/utils/plans.ts; `yarn stripe:setup` syncs Stripe.
  **To take real money:** live secret key, run `yarn stripe:setup --webhook https://slatecms.co.uk/api/stripe/webhook`
  with it, update the Worker secrets. Not VAT registered yet (24 Nov 2026): no VAT charged or shown.
- [x] Domain buying (name.com): search the name across .co.uk .uk .org.uk .com .org .net at flat yearly
  prices (shared/utils/domainPrices.ts, only offered if renewal cost + margin fits); pay yearly via Stripe;
  registered in the customer's name, ANAME/CNAME to Slate, connected with HTTPS. Simulated (nothing bought)
  while Stripe is in test mode. Cancelling the domain subscription turns auto-renew off.
  Admin → Domains: failed orders first, Try again (skips registering if name.com already has it), Mark as done.
  Bought domains get their own Cloudflare zone (needs NUXT_CLOUDFLARE_DOMAINS_TOKEN): www → Slate, bare domain 301 → https://www.
  Admin → Domains › Move DNS to Cloudflare for ones bought before. Later: remove the zone when a domain lapses or moves away.
  Owners get a transfer code from Domains (domain unlocked, admins emailed); .uk names go by IPS tag through Support.
- [x] Email (Resend, slatecms.co.uk verified, DKIM/SPF/DMARC): form replies to the reply email or owner
  (reply-to = visitor), invites by email, password reset, trial ending reminder (daily 09:00 UTC),
  failed domain orders to platform admins. Locally emails are logged, not sent.

## Next, in order

## Housekeeping (as I go)

- [x] Separate Neon branch for local development (`dev`); `yarn db:migrate:prod` for live
- [x] Drag to reorder: blocks, pages, menu links, form questions, block items (reviews, steps…), projects. Arrows stay for keyboards
- [x] Old Vercel DNS records removed (proxied AAAA 100:: placeholders for the Worker)
- [x] Daily job (03:00 UTC): purge sites deleted more than 30 days ago, their Cloudflare hostnames, old invites
- [x] Site export: Settings › Download everything (zip: site.json, pages/posts as text, replies CSV, media)

## Feedback round 1 (Dan, 24 Nov 2026)

Quick wins first, then the bigger customisation work.

1. [x] Rename "Search & sharing" to SEO
2. [x] Pages: New page button on the Pages screen; child pages nested under their parent, collapsed by default with an arrow
3. [x] Editor: block library grouped into collapsible sections, names only, (i) for the description
4. [x] Overview: stats (pages, posts, forms/replies, images, people) with recently edited below
5. [x] All sites (platform admin): dashboard (sites, plans, trials, revenue, domains, sign-ups) with the site list underneath
6. [x] Billing: platform admins can preview the customer view of the page
7. [x] Domain at sign-up: optional "find a domain" step
8. [x] People: own sidebar item (move out of Settings)
9. [x] Settings: social links, shown as icons in the footer and usable in menus
10. [x] Theme: logo, favicon, extra brand colours, heading sizes, nav size, text transforms, light/dark
11. [x] Layout section: header style (regular, centred, mega menu), header/footer colours, link to Menus
12. [x] Blocks: a gallery of every block to try out with sample content
13. [x] Integrations (25 Nov): new page with tabs; webhook, Slack, Discord, Mailchimp, Brevo, WhatsApp, Search Console/Bing, IndexNow, Smart App Banner, iOS/Android app links, Map block, built-in visitor stats (Cloudflare Web Analytics), email forwarding for Slate domains. Still to come: Kit, Stripe deposits
14. [x] Support: tickets from each site (Support page in the CMS), listed in the platform dashboard; platform admins reply, both sides emailed

## Portfolio push (for danhorne.co.uk, 24 Nov 2026)

Dan chose: refresh the design, projects as their own content type.

1. [x] Section options on every block: background (page, soft, dark, main colour, accent), spacing, fade-in on scroll, link name (anchor)
2. [x] Upgraded blocks: hero (label, two buttons, side picture, centred, coloured band), image and text (side, card/tilted/round picture, tick list, button), reviews (role, photo, one-big-quote layout), call to action (band, card, plain), services (columns, icons), labels above headings everywhere
3. [x] New blocks: projects, gallery with lightbox, before and after, details list, numbers, steps, logos and tools, timeline, team, big statement, scrolling band, video, big image, contact details
4. [x] Projects: own CMS screen (details, cover, category, buttons, order), pages at /work/…, case-study header, edited in the page editor
5. [x] More fonts: Baloo 2, Quicksand, Space Grotesk, Outfit, Plus Jakarta Sans, Instrument Serif
6. [x] Multi-step forms (step breaks in the form editor; Next/Back with per-step checks)
7. [x] Rebuild danhorne.co.uk in Slate with a refreshed design (danhorne.slatecms.co.uk, 24 Nov)
8. [x] danhorne.co.uk points at it (own Cloudflare zone, 25 Nov)
9. [x] Theme: any Google Font for headings and paragraphs
10. [x] Delete a page from the editor

## Billing extras (asked 24 Nov)

1. [x] Special price per client (fixed price instead of list price), from Admin → Billing
2. [x] Custom invoices from Admin → Billing (Stripe invoice, emailed pay link, shown in client Billing)
3. [x] Past invoices on the Billing page (already there: plans, domains, custom)
4. [x] Discount codes made from Admin → Billing

## Reliability (24 Nov 2026)

1. [x] Error log: Admin → Errors, grouped, emailed to admins once an hour per kind, kept 30 days
2. [x] Backups twice a week to R2 (newest 8 kept), Admin → Backups, restore script (tested round trip)
3. [x] Automated tests: yarn test (unit), yarn test:api (end to end against the dev server)

## Launch (24 Nov 2026)

1. [x] Stripe live (restricted key), live products, portal, webhook; Stripe receipts and billing emails on
2. [x] Discount codes WELCOME20, FRIENDS, LAUNCH25 (Dan to switch off the 13 pre-Slate codes)
3. [x] Privacy policy (/privacy) and terms (/terms), linked from the footer and sign-up. ICO number in shared/utils/legal.ts
4. [x] Browser errors in Admin → Errors (status "Browser"), capped and de-duplicated
5. [x] Slate favicon (.ico, SVG, PNGs); danhorne. logo (light and dark) in Media and Theme
6. [x] name.com: card saved, $30 credit (25 Nov). Domain orders are paid from this balance; customers pay Slate via Stripe
7. [x] Real purchase done (dobiedash.co.uk, 25 Nov). ICO registration ZC311643 on /privacy

## Support and attention (24 Nov 2026)

1. [x] Ticket types (broken, new block, help, billing, domain) with icon cards and type-specific questions; P1/P2/P3 for bugs
2. [x] Helpdesk: colour-coded tags, type filters with counts, open bugs by severity first, re-file type/severity
3. [x] Needs your attention: urgent bugs, errors in 24h, stale backups, overdue invoices, trials ending in 3 days (with links)

## Coming soon (25 Nov 2026)

1. [x] Home page shows "coming soon" with a register-interest form while `NUXT_PUBLIC_COMING_SOON` is "true" (wrangler.jsonc). Platform admins see the full page at /?full=1
2. [x] Interest list in Admin → Dashboard (CSV, remove), email to admins for each new one, in the privacy policy
3. [ ] To launch: set NUXT_PUBLIC_COMING_SOON to "false" in wrangler.jsonc and deploy; email the list (LAUNCH25 was promised as "a launch discount")

## Showcase blocks (asked 25 Nov; generic brochure blocks for an app, product, service or place)

Designs: https://claude.ai/artifact/2Azs3ZCJCw33uLwPwrd5CD. Every picture can sit in a phone, browser or photo frame;
every button row can be regular buttons or app store badges (links set once in Settings), optional QR on computers.

1. [x] Showcase hero: split, centred or coloured band; label, heading, text, buttons, optional rating
2. [x] Button row styles shared by every block (regular, store badges, QR, on a coloured background)
3. [x] Picture carousel: framed pictures with captions, arrows, swipe on phones
4. [x] Feature rows (picture and text, alternating) and feature grid (icons)
5. [ ] Proof: big numbers plus review quotes
6. [x] Closing call to action band
7. [x] Settings: app store links (iOS, Android) entered once; /get-app on each site sends phones to the right store (the QR code's target)
8. [ ] Official Apple/Google badge artwork (needs the files from Apple and Google; drawn badges for now)

## 25 Nov 2026

1. [x] Settings: one row per section; Pages: projects under Work; Forms: Unread/Read/Done
2. [x] System pages: locked, editable Page not found (404)
3. [x] Tables: sorting, search, filters and pages everywhere (useDataTable, SortTh, TablePager); Home always first
4. [x] SEO: choose share images from Media; share previews get the full image address
5. [x] Local development: client sites stay local; local data refreshed from live on request
6. [ ] Check visitor stats appear on Overview and email forwarding works on a Slate domain
7. [x] System pages: editable Offline page (503) shown on every address while offline; form inbox search/sort/pages
8. [x] Redirects (SEO page): one or a pasted list, used only when no page is at the address, hit counts; 301s for pages and blog posts
9. [x] Page history: every publish kept (last 30), restore as draft from the editor's History button
10. [x] Site health on Overview: score plus fixes (broken links, unpublished changes, descriptions, share images, privacy policy, waiting replies, big images, alt text, domain, icon, Search Console)
11. [ ] Later, no extra cost: monthly "how your site did" email; image resizing at upload
12. [x] Marketing site (behind coming soon): home, 6 feature pages, 5 "who it's for" pages, pricing, 3 comparisons, guides (from the "Slate guides" site's blog), about, contact (into that site's inbox), legal. Mega menus, full-screen phone menu, share images, structured data, sitemap, IndexNow. Design: docs/superpowers/specs/2026-11-26-marketing-site-design.md
13. [x] Demo videos: `yarn dev:test`, then `node --env-file=.env scripts/demo-site.mjs` and `yarn demos:record` (re-run when the CMS changes). Share images: `yarn og:images`
14a. [x] Help centre at /help: 45 how-to articles (content/help/*.md, bundled by scripts/help-index.mjs before every build) with screenshots (`yarn demos:record --shots`). Linked from the CMS sidebar, a "Help with this page" link on every CMS screen, /guides and the footer. Open before launch. Design: docs/superpowers/specs/2026-11-26-help-centre-design.md
14. [x] Launched 26 Nov 2026 (coming soon off); sitemap submitted in Search Console. Dropped by Dan: the waiting-list launch email, and Bing for now. Still to do: live page-speed check once there's traffic.
    Original launch list: set NUXT_PUBLIC_COMING_SOON to "false" in wrangler.jsonc and deploy; submit https://slatecms.co.uk/sitemap.xml in Search Console; email the waiting list with LAUNCH25; check page speed on the live site

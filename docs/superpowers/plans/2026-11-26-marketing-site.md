# Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A multi-page, search-friendly marketing site on slatecms.co.uk with demo videos, built behind the coming-soon switch.

**Architecture:** Coded Nuxt pages under the app host using a new `marketing` layout and a small set of section components. One registry (`shared/utils/marketing.ts`) lists every page with its title, description and share image; the header, footer, sitemap and SEO tags all read it. Guides come from a Slate site's blog (`NUXT_MARKETING_SITE_ID`). Videos and share images are produced by scripts and served as static assets.

**Tech Stack:** Nuxt 4, Vue SFCs, Nitro routes, Drizzle (existing blog/forms tables), Playwright (recording), ffmpeg-static (encoding), headless Chrome (share images), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-26-marketing-site-design.md`

## Global Constraints

- Copy: plain words, sentence case, no exclamation marks, UK spelling (CLAUDE.md brand sheet).
- No fake reviews, customer counts, logos or testimonials; examples are danhorne.co.uk and dobiedash.co.uk, or labelled "example site".
- Competitor facts carry a "checked on 26 Nov 2026" line and link to the competitor's own page.
- Prices and plan limits only from `shared/utils/plans.ts` (`PLANS`, `planRowsFor()`, `TRIAL_DAYS` = 14).
- Every marketing page: one h1, unique title (≤ 60 chars) and description (120–160 chars), canonical, Open Graph image 1200×630.
- `lang="en-GB"`; readable without client JS; videos `preload="none"`, muted, looped, inline, play only in view, pause button, poster only under `prefers-reduced-motion`.
- Each video file under 4 MB.
- While `NUXT_PUBLIC_COMING_SOON` is true: the public sees only the coming-soon page; platform admins see everything.
- 4-space indent, single quotes, no semicolons, no trailing commas (CLAUDE.md).

## Review Focus

1. A logged-out visitor during coming soon opens `/pricing` or `/guides/x` directly: expect a redirect to `/` (coming-soon page), never the page, never a 500. → Task 1 test.
2. A guide slug that doesn't exist, or a draft/scheduled post: expect the marketing 404, and a redirect if one is set on the guides site. → Task 7 test.
3. `NUXT_MARKETING_SITE_ID` empty or pointing at a deleted site: `/guides` shows "No guides yet", the sitemap still works, contact shows the email address instead of the form. → Task 7 and Task 8 tests.
4. Contact form spam or empty fields: bot check required, honeypot and rate limit as on client forms, clear error per field. → Task 8 test.
5. Sitemap during coming soon must not list unreleased pages; after launch it lists every registry page and every guide. → Task 10 test.

---

### Task 1: Registry, layout, SEO helper and preview gate

**Files:**
- Create: `shared/utils/marketing.ts`, `app/layouts/marketing.vue`, `app/components/marketing/MkHeader.vue`, `app/components/marketing/MkFooter.vue`, `app/composables/useMarketingSeo.ts`, `app/middleware/marketing.ts`
- Modify: `app/pages/index.vue`, `tests/setup-globals.ts`
- Test: `tests/unit/marketing.test.ts`, `tests/api/marketing.test.ts`

**Interfaces:**
- Produces:
  - `interface MarketingPage { path: string, title: string, description: string, h1: string, section: 'home' | 'features' | 'for' | 'pricing' | 'compare' | 'guides' | 'company' | 'legal', navLabel?: string, image: string /* /og/<name>.png */ }`
  - `MARKETING_PAGES: MarketingPage[]` (every path in the spec's site map), `marketingPage(path: string): MarketingPage`
  - `useMarketingSeo(path: string, extra?: { jsonLd?: Record<string, unknown>[], title?: string, description?: string, image?: string })` sets title, description, canonical `https://slatecms.co.uk<path>`, OG/Twitter, BreadcrumbList JSON-LD, plus `extra.jsonLd`
  - Layout `marketing` (header with Features and Who it's for menus, Pricing, Guides, Log in, Start free trial; footer linking every registry page)
  - Route middleware `marketing`: when `comingSoon` and the visitor isn't a platform admin, `navigateTo('/')` for any marketing path except `/`, `/privacy`, `/terms`

- [ ] **Step 1: Write failing unit tests** in `tests/unit/marketing.test.ts`: `paths are unique and start with /`; `titles are at most 60 characters and descriptions 120 to 160`; `every spec path is present` (assert the 21 paths from the spec's site map table, excluding `/guides/[slug]`); `every page names a share image under /og/`.
- [ ] **Step 2:** `yarn test` → FAIL (module missing).
- [ ] **Step 3:** Implement the registry with final copy for every page, the layout and header/footer (Slate brand tokens from `app/assets/css/main.css`; mobile menu as a `<details>` disclosure so it works without JS), `useMarketingSeo`, and the middleware. `app/pages/index.vue` uses the `marketing` layout for the full home (ComingSoon unchanged).
- [ ] **Step 4:** `yarn test` → PASS.
- [ ] **Step 5: API test** `tests/api/marketing.test.ts` › `coming soon keeps unreleased pages private`: run against the test server started with `NUXT_PUBLIC_COMING_SOON=true` on port 3003 (`SLATE_BUILD_DIR=.nuxt-test2`); logged-out `GET /pricing` → 302 to `/`; a platform admin (helpers `newAccount` + `makeAdmin`) → 200 containing the pricing h1. Skips itself (with a console note) when `TEST_COMING_SOON_URL` is unset.
- [ ] **Step 6:** Run with `TEST_COMING_SOON_URL=http://localhost:3003 yarn test:api tests/api/marketing.test.ts` → PASS.
- [ ] **Step 7: Commit** `Marketing: page registry, layout, SEO helper, preview gate`.

### Task 2: Section components and the home page

**Files:**
- Create: `app/components/marketing/MkHero.vue`, `MkVideo.vue`, `MkFeatureGrid.vue`, `MkSplit.vue`, `MkFaq.vue`, `MkCta.vue`, `MkExamples.vue`, `MkPlans.vue`
- Modify: `app/components/MarketingHome.vue` (rebuilt from the sections; drop the made-up example sites)
- Test: `tests/unit/marketing.test.ts`

**Interfaces:**
- Consumes: `useMarketingSeo`, `MARKETING_PAGES`
- Produces (props):
  - `MkHero { eyebrow?: string, title: string, lead: string, video?: string /* name in /videos */, image?: string }`
  - `MkVideo { name: string, caption: string }` → `/videos/<name>.mp4`, poster `/videos/<name>.webp`
  - `MkFeatureGrid { items: { icon: string, title: string, text: string, to?: string }[] }` (icons from `SHOWCASE_ICONS`)
  - `MkSplit { title: string, text: string, points?: string[], video?: string, image?: string, flip?: boolean }`
  - `MkFaq { items: { q: string, a: string }[] }` and `faqJsonLd(items): Record<string, unknown>` exported from `shared/utils/marketing.ts`
  - `MkCta { title?: string, text?: string }` (default: start free trial, `TRIAL_DAYS` days)
  - `MkExamples` (danhorne.co.uk and dobiedash.co.uk cards with screenshot `/og/example-danhorne.png`, `/og/example-dobiedash.png`)
  - `MkPlans { compact?: boolean }` from `PLANS`

- [ ] **Step 1: Failing test** `faqJsonLd builds FAQPage`: `faqJsonLd([{ q: 'A?', a: 'B.' }])` deep-equals `{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'A?', acceptedAnswer: { '@type': 'Answer', text: 'B.' } }] }`.
- [ ] **Step 2:** `yarn test` → FAIL.
- [ ] **Step 3:** Build the components and the home page. MkVideo: `<video muted loop playsinline preload="none" :poster>`; IntersectionObserver plays at ≥ 50 % visible and pauses when hidden; a visible pause/play button; under reduced motion it never autoplays. Home JSON-LD: Organization (name Slate, url, logo `/slate-logo.png` if present else `/favicon.svg`, email hello@slatecms.co.uk, address locality Warrington, country GB) and WebSite.
- [ ] **Step 4:** `yarn test` → PASS; `yarn typecheck` clean.
- [ ] **Step 5:** Look at `/` on the local server as an admin at 1440 px and 390 px wide; nothing overflows horizontally.
- [ ] **Step 6: Commit** `Marketing: section components and new home page`.

### Task 3: Feature pages

**Files:**
- Create: `app/pages/features/index.vue`, `app/pages/features/editor.vue`, `domains-and-email.vue`, `forms.vue`, `seo.vue`, `integrations.vue`
- Test: `tests/api/marketing.test.ts`

**Interfaces:**
- Consumes: Task 1 and 2 components; videos named `tour`, `editor`, `domains`, `forms`, `seo`, `integrations` (files arrive in Task 11; MkVideo shows the poster or a neutral box until then).

- [ ] **Step 1: Failing API test** `feature pages render with one h1 and their own title`: for each `/features…` path on the normal test server (coming soon off), status 200, exactly one `<h1`, `<title>` equals the registry title, canonical link present.
- [ ] **Step 2:** Run → FAIL (404).
- [ ] **Step 3:** Write the six pages. Each: MkHero (with its video), 3–5 MkSplit sections describing real features (names as they appear in the CMS), MkFaq where useful, MkCta. Overview links every feature page.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** `Marketing: feature pages`.

### Task 4: Sector pages

**Files:**
- Create: `shared/utils/marketingSectors.ts`, `app/pages/for/[sector].vue`
- Test: `tests/unit/marketing.test.ts`, `tests/api/marketing.test.ts`

**Interfaces:**
- Produces: `interface Sector { slug: 'trades' | 'salons-and-clinics' | 'shops-and-cafes' | 'clubs-and-charities' | 'freelancers-and-studios', layoutId: string /* id in STARTER_LAYOUTS */, problems: { title: string, text: string }[], sections: string[], features: { title: string, text: string }[], faq: { q: string, a: string }[] }`, `SECTORS: Sector[]`, `sector(slug): Sector | undefined`

- [ ] **Step 1: Failing unit tests:** `every sector has a matching starter layout` (layoutId exists in `STARTER_LAYOUTS`); `sector pages are genuinely different`: no two sectors share a problem title or FAQ question, each has ≥ 3 problems, ≥ 4 features, ≥ 4 FAQs.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Write the content and the page (registry entry supplies title/description; unknown slug → 404). FAQ JSON-LD on each.
- [ ] **Step 4: API test** `sector pages`: each of the five → 200 with one h1; `/for/plumbers` → 404.
- [ ] **Step 5:** Unit and API → PASS.
- [ ] **Step 6: Commit** `Marketing: sector pages`.

### Task 5: Pricing

**Files:**
- Create: `app/pages/pricing.vue`
- Modify: `shared/utils/marketing.ts` (add `pricingJsonLd()`)
- Test: `tests/unit/marketing.test.ts`

**Interfaces:**
- Produces: `pricingJsonLd(): Record<string, unknown>` → SoftwareApplication with `offers` as an `AggregateOffer` (`priceCurrency: 'GBP'`, `lowPrice` and `highPrice` from `PLANS` monthly prices in pounds, `offerCount` = number of plans).

- [ ] **Step 1: Failing test** `pricing structured data matches the plans`: lowPrice `'15.00'`, highPrice `'49.00'`, offerCount 3 (derive expected values from `PLANS`, not literals).
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Page: monthly/yearly toggle, plan cards (MkPlans), the full `planRowsFor()` table, FAQ (trial, cancelling, VAT not added, domains billed yearly, moving away/export).
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `Marketing: pricing page`.

### Task 6: Comparison pages

**Files:**
- Create: `shared/utils/marketingCompare.ts`, `app/pages/compare/[rival].vue`
- Test: `tests/unit/marketing.test.ts`

**Interfaces:**
- Produces: `interface Rival { slug: 'wix' | 'squarespace' | 'wordpress', name: string, checked: '26 Nov 2026', sources: { label: string, url: string }[], rows: { topic: string, slate: string, rival: string }[], fit: { slate: string[], rival: string[] } }`, `RIVALS`

- [ ] **Step 1:** Research each rival's current UK pricing and relevant features from their own websites (web-fetch); note the URLs.
- [ ] **Step 2: Failing test** `every comparison is dated and sourced`: each rival has `checked` and ≥ 1 source with an `https://` URL on the rival's own domain; every row has non-empty cells.
- [ ] **Step 3:** → FAIL, then write the data and page ("Where Slate fits", "Where <rival> fits": honest both ways), → PASS.
- [ ] **Step 4: Commit** `Marketing: comparison pages`.

### Task 7: Guides from a Slate site

**Files:**
- Create: `server/api/marketing/guides/index.get.ts`, `server/api/marketing/guides/[slug].get.ts`, `server/utils/marketingSite.ts`, `app/pages/guides/index.vue`, `app/pages/guides/[slug].vue`
- Modify: `nuxt.config.ts` (`runtimeConfig.marketingSiteId: ''`), `wrangler.jsonc` (var `NUXT_MARKETING_SITE_ID` after the site exists)
- Test: `tests/api/marketing.test.ts`

**Interfaces:**
- Produces: `marketingSite(): Promise<Site | null>` (null when unset, not a UUID, missing or deleted); `GET /api/marketing/guides?category=` → `{ guides: PublicPostSummary[], categories: { name, slug }[] }`; `GET /api/marketing/guides/:slug` → `{ post, more }` same shape as `/api/public/blog/[slug]` (404 with redirect data via `findRedirect(event, site.id, '/blog/<slug>')`).
- Article JSON-LD on each guide (headline, datePublished, dateModified, author Dan Horne, publisher Slate, image).

- [ ] **Step 1: Failing API tests** (test server with `NUXT_MARKETING_SITE_ID` set to a site created in `beforeAll` via `newAccount`): published post listed and readable at `/guides/<slug>`; draft and future-scheduled posts → 404; with the ID unset (`marketingSite()` unit-tested via a second describe that calls the route on a server without it, or skipped with a note) `/api/marketing/guides` → `{ guides: [] }` not 500.
- [ ] **Step 2:** → FAIL. **Step 3:** Implement. **Step 4:** → PASS.
- [ ] **Step 5:** On prod: create the Slate site "Slate guides" (owner Dan, comped), set its ID in `wrangler.jsonc`, write the four starter guides from the spec as published posts with cover images and categories ("Getting found", "Running your site", "Rules and paperwork").
- [ ] **Step 6: Commit** `Marketing: guides from Slate`.

### Task 8: About, contact, privacy and terms

**Files:**
- Create: `app/pages/about.vue`, `app/pages/contact.vue`, `server/api/marketing/contact.post.ts`
- Modify: `app/pages/privacy.vue`, `app/pages/terms.vue`, `app/components/LegalPage.vue` (marketing layout)
- Test: `tests/api/marketing.test.ts`

**Interfaces:**
- Consumes: `marketingSite()`, `validateSubmission`, `notifyFormReply`, Turnstile check used by `/api/public/interest`.
- Produces: `POST /api/marketing/contact { answers, website, startedAt, turnstile }` → `{ ok: true, message }`; stores a reply on the guides site's form named "Contact" (created by `ensureMarketingContactForm(siteId)` if missing: Name, Email, Message).

- [ ] **Step 1: Failing API tests:** valid message → 200 and a `form_replies` row on the marketing site; missing email → 400 naming the field; honeypot filled → 200 with no row; sixth message in 10 minutes from one sender → 429; no marketing site configured → 503 with a message to email hello@slatecms.co.uk.
- [ ] **Step 2:** → FAIL. **Step 3:** Implement (About: Dan, Warrington, why Slate exists, how data is kept; Contact: form + email + response time). **Step 4:** → PASS.
- [ ] **Step 5: Commit** `Marketing: about, contact, legal pages`.

### Task 9: Share images and example screenshots

**Files:**
- Create: `scripts/share-images.mjs`, `public/og/*.png` (one per registry page plus `example-danhorne.png`, `example-dobiedash.png`, `default.png`)
- Modify: `package.json` (`"og:images": "node scripts/share-images.mjs"`)
- Test: `tests/unit/marketing.test.ts`

- [ ] **Step 1: Failing test** `every page's share image exists`: for each registry page, `public<image>` exists and its PNG header says 1200×630.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Script renders an HTML template per page (Slate brand: logo, eyebrow = section, h1, short line, slatecms.co.uk/<path>) with headless Chrome at 1200×630; example screenshots captured from the live sites at 1440×900 then cropped to 1200×630.
- [ ] **Step 4:** `yarn og:images` then `yarn test` → PASS. Look at three of the images.
- [ ] **Step 5: Commit** `Marketing: share images`.

### Task 10: Sitemap, robots and IndexNow for the marketing host

**Files:**
- Modify: `server/routes/sitemap.xml.ts`, `server/utils/indexNow.ts` (export `pingMarketing(paths: string[])`), `server/routes/indexnow-key.txt.ts` (app host key), `server/api/sites/[siteId]/posts/[postId].patch.ts` (ping `/guides/<slug>` when the site is the marketing site)
- Test: `tests/api/marketing.test.ts`

- [ ] **Step 1: Failing API tests:** coming soon off → sitemap lists every `MARKETING_PAGES` path and each published guide as `/guides/<slug>` with `<lastmod>`; coming soon on (port 3003 server) → only `/` (and `/signup` is not listed until launch).
- [ ] **Step 2:** → FAIL. **Step 3:** Implement. **Step 4:** → PASS.
- [ ] **Step 5: Commit** `Marketing: sitemap and IndexNow`.

### Task 11: Demo site and videos

**Files:**
- Create: `scripts/demo-site.mjs` (seeds "Bramble & Oak Upholstery" on the local dev database through the API: account, theme, pages, form, replies, media), `scripts/record-demos.mjs`, `public/videos/{tour,editor,domains,forms,seo,integrations}.{mp4,webp}`
- Modify: `package.json` (`"demos:record": "node scripts/record-demos.mjs"`, devDependency `ffmpeg-static`)

**Interfaces:**
- `record-demos.mjs [name…]`: logs in as the demo account on `http://localhost:3002`, runs one scripted scene per video (Playwright `recordVideo` 1440×900, slowed typing and cursor highlights), overlays short captions with an on-page caption bar injected by the script, encodes with ffmpeg-static to H.264 MP4 (CRF ~28, 1280 px wide, no audio, `+faststart`) and a WebP poster from the first strong frame.

- [ ] **Step 1:** Seed the demo site; check it in the browser.
- [ ] **Step 2:** Record `tour` (sign-up → layout → edit block → theme colour → publish → live site, 45–60 s); watch it; adjust pacing.
- [ ] **Step 3:** Record the other five (30–45 s each) per the spec's list.
- [ ] **Step 4: Verify:** each MP4 < 4 MB, 30–60 s (`ffmpeg-static -i` duration), plays in Chrome and Safari (H.264), posters exist.
- [ ] **Step 5: Commit** `Marketing: demo videos`.

### Task 12: Quality pass and launch readiness

**Files:**
- Modify: `docs/plan.md`
- Test: Lighthouse via Chrome DevTools protocol on the local production build (`yarn preview`)

- [ ] **Step 1:** Lighthouse mobile on `/`, `/pricing`, `/features/editor`, `/for/trades`, `/guides/<one>`: Performance, Accessibility, Best Practices, SEO each ≥ 95; fix what falls short.
- [ ] **Step 2:** Validate JSON-LD on those pages (parse every `application/ld+json` block; required fields present) in an API test `structured data is valid JSON with @context and @type`.
- [ ] **Step 3:** All tests, typecheck, deploy (still behind coming soon); Dan previews on live as admin.
- [ ] **Step 4:** Update `docs/plan.md` (marketing section, launch steps). Commit `Marketing: quality pass`.

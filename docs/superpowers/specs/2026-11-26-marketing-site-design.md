# Slate marketing site: design

26 Nov 2026. Agreed with Dan in chat; this records it for building.

## Intent

Today slatecms.co.uk shows a coming-soon page, with one long home page hidden behind it. Dan wants a real
multi-page marketing site that sells Slate to UK small businesses and the people who build sites for them:
more detail on what Slate does, short videos of the real CMS, and SEO strong enough to rank on Google.

Why: Slate is about to launch. The site has to turn visitors into sign-ups and bring in visitors from search
without paid ads.

## Goals

- Multi-page site on slatecms.co.uk: home, features, "who it's for", pricing, comparisons, guides, about, contact.
- Short demo videos (30–60 s, several screens each, silent with on-screen captions) of the real CMS, plus screenshots.
- Rank for specific UK searches: trade and sector pages ("website for plumbers"), comparisons
  ("Wix alternative UK"), and helpful guides. Strong technical SEO on every page.
- Dan can add guides himself, without code, through Slate's own blog.

## Non-goals

- Ranking for "website builder" against Wix and Squarespace (not realistic for a new site).
- An interactive "try it" playground (Dan chose videos).
- AI features, paid tools, or anything with running costs (Dan doesn't want extra charges).

## Anti-goals (would make this a failure even if it works)

- Made-up proof: no fake reviews, customer counts, logos or testimonials. Examples are real sites made
  with Slate (danhorne.co.uk, dobiedash.co.uk) or clearly labelled as examples.
- Claims about competitors that aren't true or can't be checked. Comparison facts carry a "checked on" date
  and link to the competitor's own pricing page.
- Slowing the site down: videos must not hurt page speed (lazy-loaded, poster images, small files).
- Leaking the CMS into search results.

## Approaches

| | Approach | Trade-off | |
|---|---|---|---|
| A | Coded pages in the Nuxt app; guides come from a Slate site's blog, shown at /guides | Full design control, fastest pages, pricing and comparisons from real data; guides editable by Dan | **Chosen** |
| B | Whole marketing site built as a Slate site | "Built with Slate" story, but rich sections (pricing from plans, comparison tables, video sections) are hard to make feel premium | |
| C | Separate static site (e.g. another repo) | Isolated, but duplicates the brand, pricing and auth links; two things to deploy | |

Demos: Dan chose recorded videos and screenshots over an interactive playground.

## Site map (all on slatecms.co.uk; CMS routes unchanged)

| Path | Purpose |
|---|---|
| `/` | Story, hero video, what's included, made-with-Slate examples, pricing teaser, FAQ, call to sign up |
| `/features` | Overview of everything, linking to each feature page |
| `/features/editor` | Pages, blocks, theme, layout, page history |
| `/features/domains-and-email` | Buy or connect a domain, free email forwarding |
| `/features/forms` | Forms, inbox, statuses, webhooks/Slack/Mailchimp |
| `/features/seo` | SEO page, share images, site health, redirects, Search Console, IndexNow, sitemap |
| `/features/integrations` | The integrations catalogue |
| `/for/trades`, `/for/salons-and-clinics`, `/for/shops-and-cafes`, `/for/clubs-and-charities`, `/for/freelancers-and-studios` | Sector pages: their problems, the matching starting layout, relevant features, FAQ |
| `/pricing` | Plans from `shared/utils/plans.ts`, full comparison table, FAQ |
| `/compare/wix`, `/compare/squarespace`, `/compare/wordpress` | Honest comparisons, dated and sourced |
| `/guides`, `/guides/[slug]` | Articles from the marketing Slate site's blog |
| `/about` | Who's behind Slate (Dan, Warrington), why it exists |
| `/contact` | Contact form into Dan's Slate inbox, plus email |
| `/privacy`, `/terms` | Existing pages, restyled into the new layout |

Shared header (Features menu, Who it's for menu, Pricing, Guides, Log in, Start free trial) and a full footer
with every page linked (helps Google find them).

## Content rules

- Brand sheet copy: plain words, sentence case, no exclamation marks, UK spelling.
- Each page has one clear job and a sign-up call to action.
- Sector pages are genuinely different (problems, example sections, FAQ for that sector), not one template
  with the noun swapped. Google penalises thin near-duplicates.
- Prices and plan limits always come from `plans.ts`, never typed into copy.
- Starter guides written now (Dan can edit or add more in Slate): how to get your business on Google;
  what to put on a small business website; moving from Wix to your own domain without losing Google;
  website rules for UK small businesses (privacy, cookies, contact details).

## Demo videos

- Recorded by a script (Playwright, already installed for tests' browsers) driving a polished demo site in
  the local CMS at 1440×900, then encoded with `ffmpeg-static` (dev dependency) to H.264 MP4 plus a WebP
  poster frame. Re-runnable when the CMS changes: `yarn demos:record`.
- Demo site: "Bramble & Oak Upholstery" (fictional, labelled "example site" where shown), seeded by the script
  with good pictures, pages, a form and replies.
- Videos (each 30–60 s, captions burned in as short on-screen labels, no sound):
  1. Home hero: sign up → pick a layout → edit a block → change theme colour → publish → live site.
  2. Editor: add and reorder blocks, edit text, page history restore.
  3. Domains and email: search and buy flow (test mode), email forwarding.
  4. Forms: a reply arrives, statuses, mark done, Slack/Mailchimp card.
  5. SEO: SEO page, share image picker, site health with fix links, redirects list.
  6. Integrations: tabs, connect WhatsApp, the button on the live site.
- Played muted, looped, inline, only when scrolled into view (`preload="none"`, poster shown first), with a
  pause button and `prefers-reduced-motion` respected (poster only, play on click).
- Served as static assets from the Worker (each file well under the 25 MB asset limit; aim for under 4 MB).

## SEO

- Every page: unique title and description, canonical URL, Open Graph/Twitter tags, its own 1200×630 share
  image (generated by a script in the Slate brand, like the danhorne ones).
- Structured data (JSON-LD): Organization and WebSite (home), SoftwareApplication with offers (pricing),
  FAQPage (pages with FAQs), BreadcrumbList (all sub-pages), Article (guides).
- Sitemap lists every marketing page and guide with last-modified dates; robots.txt keeps CMS paths out
  (already does) and `noindex` stays on app pages.
- IndexNow ping for the marketing host when a guide is published and on deploy.
- `lang="en-GB"`, semantic headings (one h1), descriptive link text, alt text everywhere.
- Speed: no client-side JS needed to read pages; images sized and lazy-loaded; fonts preconnected;
  aim for Lighthouse 95+ on mobile for performance, accessibility, best practices and SEO.

## Guides from Slate

- A Slate site owned by Dan (e.g. slug `slate-guides`), its ID in `NUXT_MARKETING_SITE_ID`.
- `/guides` and `/guides/[slug]` render that site's published posts with the marketing layout, using the
  existing blog code (`livePosts`, post bodies). Categories become filters.
- The contact form is a form on that site; `/contact` posts to an app-host route that stores the reply against
  that site, so it lands in Dan's Slate inbox and email like any other.

## Launch

- Everything is built behind the existing coming-soon switch. Platform admins preview with `?full=1`
  (extended to every marketing page). Search engines see nothing new until launch.
- Launch (when Dan says): set `NUXT_PUBLIC_COMING_SOON` to false, deploy, submit the sitemap in Search Console,
  email the waiting list with the LAUNCH25 code.

## Left to the builder

- Exact copy, layouts within the Slate brand (tokens in `app/assets/css/main.css`), component structure.
- Video shot lists and caption wording within the list above.
- Competitor facts: researched at build time from their own sites, dated.

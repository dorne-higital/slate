# Help Centre Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Task-based how-to articles at slatecms.co.uk/help, linked from the CMS, /guides and the footer.

**Architecture:** Articles are Markdown files with a small frontmatter block in `content/help/`, bundled into the server with `import.meta.glob(..., { query: '?raw', eager: true })` and rendered to HTML with `marked`. Two API routes serve the list and one article; two Nuxt pages render them in the marketing layout. Screenshots come from the demo recorder (`yarn demos:record --shots`) into `public/help/`.

**Tech Stack:** Nuxt 4, Nitro, `marked` (new dependency), Vitest, the existing demo recorder (playwright-core + Chrome).

**Spec:** `docs/superpowers/specs/2026-11-26-help-centre-design.md`

## Global Constraints

- Copy: plain words, sentence case, no exclamation marks, UK spelling; one task per article; numbered steps.
- Open to everyone before launch; non-admins see it without menus that link to unreleased marketing pages (as privacy/terms).
- Each article: unique title (≤ 60 chars) and summary (≤ 160 chars); HowTo + BreadcrumbList structured data.
- No running costs; nothing third-party.
- 4-space indent, single quotes, no semicolons (CLAUDE.md).

## Review Focus

1. An article links to another article or a screenshot that doesn't exist → a unit test fails (never a broken link or image live). → Task 1 test.
2. `/help/<unknown>` → 404, not 500. → Task 2 test.
3. Logged-out visitor before launch opens `/help` → 200, no links to `/pricing` or other unreleased pages. → Task 2 test.
4. Search with no matches → "No articles match" plus a link to contact support, not an empty page. → Task 2 (page) and manual check.
5. A CMS screen with no matching help area → no help link shown (never a link to an empty area). → Task 4 test.

---

### Task 1: Article loader and the first article

**Files:**
- Create: `content/help/add-a-page.md`, `server/utils/help.ts`, `shared/utils/helpAreas.ts`
- Modify: `package.json` (`marked`), `tests/setup-globals.ts`
- Test: `tests/unit/help.test.ts`

**Interfaces:**
- Produces:
  - `HELP_AREAS: { key: HelpArea, name: string, blurb: string, icon: string, screens: string[] /* CMS route names under /sites/[siteId], e.g. 'pages', 'theme' */ }[]` with keys `getting-started, pages, look, blog, forms, media, domains, search, integrations, people, account` (order = display order)
  - `interface HelpArticle { slug: string, title: string, summary: string, area: HelpArea, order: number, related: string[], html: string, steps: string[] /* text of each numbered step, for HowTo */, popular: boolean }`
  - `helpArticles(): HelpArticle[]` (sorted by area order, then `order`), `helpArticle(slug): HelpArticle | undefined`
  - Frontmatter between `---` lines: `title`, `summary`, `area`, `order`, `related` (comma-separated slugs), `popular` (true/false)
  - Links between articles written as `[text](help:slug)`, rewritten to `/help/slug`; images as `![alt](shot:name)`, rewritten to `/help/name.png`

- [ ] **Step 1: Failing tests** in `tests/unit/help.test.ts`: `every article has a title, summary and known area` (title ≤ 60, summary ≤ 160); `slugs are unique and match file names`; `every help: link and related slug points at an article`; `every shot: image exists in public/help`; `steps are extracted from the numbered list` (for add-a-page: ≥ 3 steps, first starts with "Open").
- [ ] **Step 2:** `yarn test tests/unit/help.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement the loader (frontmatter split by hand; `marked` for the body; links/images rewritten before rendering; `steps` = text of the first ordered list's items). Write `add-a-page.md`.
- [ ] **Step 4:** → PASS (create a placeholder `public/help/pages-list.png` until Task 3 captures real ones). **Step 5: Commit** `Help: article loader`.

### Task 2: Help pages and API

**Files:**
- Create: `server/api/help/index.get.ts` (→ `{ areas: { key, name, blurb, icon, articles: { slug, title, summary, popular }[] }[] }`), `server/api/help/[slug].get.ts` (→ article + `related` summaries; 404 when unknown), `app/pages/help/index.vue`, `app/pages/help/[slug].vue`
- Modify: `app/middleware/marketing.ts` (treat `/help` and `/help/*` like privacy/terms), `shared/utils/marketing.ts` (registry entry `/help`, section `company`, navLabel `Help`), `server/routes/sitemap.xml.ts` (every article after launch), `app/pages/guides/index.vue` (link block at the bottom), `app/components/marketing/MkFooter.vue` (Help link), `scripts/share-images.ts` run for `/og/help.png`
- Test: `tests/api/help.test.ts`, `tests/unit/marketing.test.ts` (spec path list gains `/help`)

- [ ] **Step 1: Failing API tests:** `/help` and `/help/add-a-page` → 200 with one h1 and HowTo JSON-LD on the article; `/help/nope` and `/api/help/nope` → 404; coming-soon server: logged-out `/help` → 200 and not containing `href="/pricing"`; launched sitemap contains `/help/add-a-page`.
- [ ] **Step 2:** → FAIL. **Step 3:** Implement. `/help`: search box (filters client-side over title + summary; "No articles match" with a support link), popular row, area cards with article lists. Article page: breadcrumbs (Help › Area), body, related, "Still stuck?" (CMS Support when signed in with a site, else `/contact`). **Step 4:** → PASS. **Step 5: Commit** `Help: pages, API, links from guides and footer`.

### Task 3: The articles and screenshots

**Files:**
- Create: `content/help/*.md` (every article in the spec's list, ~40), `public/help/*.png`
- Modify: `scripts/record-demos.ts` (`--shots`: visits each screen of the demo site and saves 1280-wide PNGs named in a `SHOTS` map)

- [ ] **Step 1:** Add `--shots` and capture the screens the articles need. **Step 2:** Write the articles (steps match the real labels: check with `--inspect`). **Step 3:** `yarn test tests/unit/help.test.ts` → PASS (links, images, lengths). Look at three articles in the browser. **Step 4: Commit** `Help: articles and screenshots`.

### Task 4: Help from inside the CMS

**Files:**
- Create: `app/components/CmsHelpLink.vue` (props `screen: string`; renders "Help with this page" linking to `/help#<area>` for the area whose `screens` include it, else nothing), `shared/utils/helpAreas.ts` gains `helpAreaFor(screen: string): HelpArea | null`
- Modify: `app/components/CmsSidebar.vue` (a "Help" item opening `/help` in a new tab), each CMS page's header (`pages`, `blog`, `projects`, `forms`, `media`, `menus`, `theme`, `layout`, `blocks`, `seo`, `domains`, `integrations`, `people`, `settings`, `billing`, editor) gets `<CmsHelpLink screen="…" />`
- Test: `tests/unit/help.test.ts`

- [ ] **Step 1: Failing test** `every CMS screen maps to an area with articles, unknown screens map to null`: `helpAreaFor('theme') === 'look'`, `helpAreaFor('nope') === null`, and each listed screen's area has ≥ 1 article.
- [ ] **Step 2:** → FAIL. **Step 3:** Implement and place the links. **Step 4:** → PASS; look at two CMS screens. **Step 5:** All tests, typecheck, deploy, update `docs/plan.md`. **Commit** `Help: links from every CMS screen`.

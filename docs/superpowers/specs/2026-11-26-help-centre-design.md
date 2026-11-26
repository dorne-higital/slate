# Slate help centre: design

26 Nov 2026. From Dan in chat.

## Intent

People using Slate need short, task-based help: "how do I add a page", "how do I reorder my blocks". Today the
CMS only has Support tickets. A help centre answers the common questions without a ticket, helps people
evaluating Slate see how easy it is, and gives search engines more useful pages.

## Goals

- `slatecms.co.uk/help`: short how-to articles, one task each, with numbered steps and real screenshots.
- Reachable from inside the CMS (sidebar link, plus a "Help with this page" link on each CMS screen to the
  articles for that screen), from the bottom of `/guides`, and from the marketing footer.
- Searchable, grouped by area.
- Easy to keep up to date as the CMS changes.

## Non-goals

- Video for every article (the six feature videos are linked where relevant).
- Live chat, AI answers, or anything with running costs.
- Letting Dan edit articles in the CMS (the blog's plain-text format can't hold screenshots and links).

## Approaches

| | Approach | Trade-off | |
|---|---|---|---|
| A | Markdown files in the repo (`content/help/*.md`), rendered by the app; screenshots captured by the demo recorder | Pictures, links, numbered steps; versioned with the code they describe; screenshots refresh with one command | **Chosen** |
| B | Posts in a Slate site's blog (like guides) | Dan can edit in Slate, but plain text only: no screenshots, links or proper steps | |
| C | Third-party help desk (e.g. Intercom, HelpScout) | Polished, but a monthly cost and off-brand | |

## Shape

- `/help`: search box, then areas as cards (Getting started, Pages and blocks, Look and layout, Blog and projects,
  Forms, Media, Domains and email, Search and site health, Integrations, People, Account and billing), each listing
  its articles. Popular articles at the top.
- `/help/<slug>`: title, one-line summary, numbered steps with screenshots, tips, "Related" articles, and
  "Still stuck? Contact support" (Support page in the CMS when signed in, `/contact` otherwise).
- Open to everyone, including before launch (existing users need it now). Listed in the sitemap after launch.
- SEO: unique title/description each, HowTo structured data, breadcrumbs.

## Articles (first set, ~40)

- **Getting started**: Create your site and pick a layout · A tour of the dashboard · Publish your first changes
- **Pages and blocks**: Add a page · Add a block to a page · Reorder blocks · Edit, copy or delete a block · Change a block's background and spacing · Put a page in the menu or under another page · Undo a change or go back to an earlier version · Preview on a phone · Hide a page or delete it · Make your own "page not found" page
- **Look and layout**: Change your colours and fonts · Add your logo and site icon · Change the header and footer · Edit your menus
- **Blog and projects**: Write and publish a blog post · Schedule a post · Organise posts into categories · Add a project
- **Forms**: Add a contact or quote form · Change a form's questions · Read and reply to form replies · Mark replies done · Download replies as a spreadsheet · Send replies to Slack or Mailchimp
- **Media**: Upload pictures and files · Describe a picture (alt text)
- **Domains and email**: Buy a domain · Connect a domain you already own · Set up email forwarding
- **Search and site health**: Write page titles and descriptions for Google · Add a share image · Use Site health · Add redirects when moving from another site · Connect Google Search Console
- **Integrations**: Add Google Analytics · Add a WhatsApp button · Add Calendly booking
- **People**: Invite someone to help edit · Change what someone can do
- **Account and billing**: Choose or change your plan · Take your site offline · Download everything

## Left to the builder

Exact wording (brand sheet: plain words, sentence case, no exclamation marks), screenshot choices, which CMS screens
link to which articles, search implementation (client-side over titles/summaries is enough).

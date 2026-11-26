// Adds the starter guides to the Slate guides site (see scripts/marketing-site.mjs).
// Only adds a guide if no post has its address yet, so edits made in Slate are never overwritten.
//
//   node --env-file=.env scripts/marketing-guides.mjs           (dev database)
//   node --env-file=.env scripts/marketing-guides.mjs --prod    (live database)
//
// Bodies use Slate's post format: blank lines between paragraphs, "## " headings, "- " list items.
import { neon } from '@neondatabase/serverless'

const prod = process.argv.includes('--prod')
const sql = neon(prod ? process.env.PROD_DATABASE_URL_UNPOOLED : process.env.NUXT_DATABASE_URL)
const [site] = await sql`select id from sites where slug = 'slate-guides'`
if (!site) throw new Error('Run scripts/marketing-site.mjs first')
const [admin] = await sql`select id from "user" where is_platform_admin order by created_at limit 1`

const GUIDES = [
    {
        slug: 'get-your-business-on-google',
        category: 'getting-found',
        title: 'How to get your small business on Google',
        excerpt: 'The free steps that make the biggest difference for a local business: your Google Business Profile, a clear website, Search Console and reviews.',
        body: `When someone near you searches for what you do, Google decides which businesses to show. You can’t pay to rank in the normal results, but you can make it easy for Google to understand what you do and where. These are the steps that matter most for a local business, roughly in order.

## 1. Claim your free Google Business Profile

This is the listing that appears on Google Maps and in the box beside search results, with your opening hours, photos and reviews. For a local business it often matters more than your website.

- Go to google.com/business and search for your business name
- Claim it if it exists, or create it if it doesn’t
- Google will ask you to verify that you run the business, sometimes by video, post or phone
- Fill in everything: category, areas you serve, opening hours, phone number, website and photos

If you work from home and don’t want your address public, choose “I deliver goods and services to my customers” and list the areas you serve instead. Your address stays hidden.

## 2. Give your website clear titles and descriptions

Each page’s title is the blue link in search results, and its description is usually the grey text underneath. Say plainly what the page is about and where:

- Good: “Emergency plumber in Warrington | Smith Plumbing”
- Not so good: “Home | Welcome”

Keep titles under about 60 characters and descriptions to one or two sentences. In Slate, you set both on the SEO page, and Site health on your Overview lists any pages that are missing them.

## 3. Say what you do and where, in plain words

Google reads your pages much like a person does. If you’re a roofer covering Wigan and St Helens, say so on your home page and services page, in normal sentences. A page for each main service helps too, because each one can then match the searches people actually make.

## 4. Tell Google your site exists

Google finds most sites eventually, but you can speed things up and see what’s happening with Google Search Console, which is free.

- Add your site at search.google.com/search-console
- Prove you own it, either with a code on your site or a record on your domain
- Submit your sitemap, which is usually your address followed by /sitemap.xml

Search Console then shows which searches you appear for, how often people click, and any problems Google finds. Slate creates your sitemap for you and lets you paste the Search Console code into Integrations.

## 5. Ask for reviews

Reviews on your Google Business Profile help you stand out and appear higher on the map. The easiest way to get them is to ask, straight after a job goes well. Google gives you a short link to share by text or email. Reply to reviews too, including the odd bad one: calmly and briefly.

## 6. Keep your details the same everywhere

Use the same business name, phone number and area wherever you’re listed: your website, Google, Facebook, Yell, trade directories. Mismatched details make it harder for Google to be sure they’re all you.

## 7. Be patient, and keep it fresh

A new site can take a few weeks to appear in results, and longer to climb. Adding photos of recent work, updating your services and writing the odd helpful post all give Google, and customers, reasons to come back.

## A quick checklist

- Google Business Profile claimed and filled in
- Every page has a clear title and description
- Your services and areas are written out in plain words
- Search Console set up and sitemap submitted
- You ask happy customers for a review`
    },
    {
        slug: 'what-to-put-on-a-small-business-website',
        category: 'running-your-site',
        title: 'What to put on a small business website',
        excerpt: 'The pages and details people look for before they get in touch, and the ones you can leave out.',
        body: `Most people visit a small business website to answer three questions: do you do what I need, are you any good, and how do I get hold of you. Everything on your site should help answer one of those.

## The home page

Your home page has a few seconds to reassure people they’re in the right place. Put these near the top:

- What you do, in one plain sentence (“Kitchen fitting in Chester and North Wales”)
- Where you work, if you’re local
- One clear next step, such as “Get a quote” or “Book an appointment”
- A good photo of your work, your premises or you

Below that, a short version of everything else: your main services, a few reviews and how to get in touch.

## Services

A page, or a section, for each thing you do. For each one, say what’s included, who it’s for and roughly what it costs or how pricing works. People are far more likely to get in touch if they have a rough idea of price. “From £X” or “most jobs cost between £X and £Y” is enough.

## Proof that you’re good

- Reviews from real customers, with a first name and town
- Photos of recent work, with before-and-after shots if they suit your trade
- Accreditations and memberships, such as Gas Safe or a trade association, where they apply
- How long you’ve been doing it

## About

People buy from people. A short about page with your name, a photo and why you do what you do builds trust, especially for one-person businesses.

## Contact

Make it easy and give people choices:

- A contact or quote form that asks the questions you need answered
- Your phone number, clickable on mobile
- Your email address
- Your opening hours and the areas you cover
- A WhatsApp button, if your customers like messaging

## The legal bits

If your site collects any personal details, such as through a contact form, you need a privacy page explaining what you collect and why. Limited companies also need to show some company details. Our guide to website rules for UK small businesses covers what’s needed.

## What you can leave out

- A long history of the business on the home page
- A news page you won’t keep up to date (an old “latest news” from three years ago does more harm than none)
- Stock photos of people shaking hands
- Anything you wouldn’t say to a customer face to face

## Make it work on phones

More than half of visits to most small business sites come from phones. Check yours on a phone before you publish: can you read it without zooming, and can you tap to call?`
    },
    {
        slug: 'move-from-wix-without-losing-google',
        category: 'getting-found',
        title: 'Moving from Wix without losing your place on Google',
        excerpt: 'How to move your website to a new platform, keep your domain and keep the Google ranking you’ve built up, step by step.',
        body: `Moving your website from Wix, Squarespace or WordPress to somewhere new doesn’t have to cost you your place on Google. What matters is that every old page address still leads somewhere sensible. This guide uses Wix as the example, but the steps are the same wherever you’re moving from.

## 1. Make a list of your current pages

Before you change anything, write down every page address on your current site. The quickest way is your sitemap: visit your address followed by /sitemap.xml. If your site has a blog, include every post.

If you have Google Search Console, its Pages report also shows which addresses Google knows about and which get the most clicks. Those are the ones to look after most carefully.

## 2. Build the new site

Recreate your pages on the new platform. Keep the words of your best-performing pages close to the original where you can; Google has already decided they’re useful. This is a good moment to improve titles and descriptions, as long as the content still matches.

Where you can, use the same page addresses. If your old services page was /services, make the new one /services too.

## 3. Add redirects for every address that changes

Platforms often use different address patterns. Wix blog posts, for example, usually live under /post/, while other platforms use /blog/. For every address that changes, add a permanent (301) redirect from the old address to the new one. That tells visitors and Google the page has moved, and passes most of its ranking to the new address.

In Slate, you add these on the SEO page, one at a time or by pasting a whole list.

- Redirect each old page to its closest new page, not everything to the home page
- Leave out pages you’re deliberately dropping, or point them to the nearest relevant page

## 4. Move your domain, or point it at the new site

You can keep your domain registered where it is and just point it at the new site, or transfer it. Pointing is quicker and lower risk: your new platform will tell you which records to change.

If your domain is registered with Wix and you want to move it, you can request a transfer from your Wix account. Domains registered or transferred very recently may need to wait before moving again.

## 5. Switch over

When the new site is ready, change your domain’s records so it points at the new platform. Keep your old Wix plan running for a few days, until the change has spread and you’ve checked everything works on the new site.

## 6. Tell Google

- In Search Console, check your property still works and submit the new sitemap
- Update the website link on your Google Business Profile if it changed
- Watch Search Console’s Pages report for addresses showing “Not found”, and add redirects for any you missed

## 7. Expect a short wobble

It’s normal for rankings to move about for a few weeks after a move while Google rechecks your pages. If every old address leads to the right new page, things usually settle back.

## Moving checklist

- List of every old page address saved
- New pages built, using the same addresses where possible
- A redirect for every address that changed
- Domain pointed at the new site
- New sitemap submitted in Search Console
- Old plan kept until you’ve checked everything`
    },
    {
        slug: 'website-rules-for-uk-small-businesses',
        category: 'rules-and-paperwork',
        title: 'Website rules for UK small businesses',
        excerpt: 'The privacy, cookie and business-information rules that apply to most UK small business websites, in plain English.',
        body: `There are a few rules that apply to almost every UK business website. None of them are complicated, but they’re easy to miss. This guide is a plain-English summary, not legal advice: if you’re unsure about your situation, the ICO and GOV.UK websites have detailed guidance.

## Privacy: tell people what you collect

Under UK GDPR, if your website collects any personal information, such as names and emails through a contact form, you need to tell people:

- Who you are and how to contact you
- What you collect and why
- How long you keep it
- Who you share it with, such as your website or email provider
- Their rights, including asking to see or delete their information, and complaining to the ICO

This usually goes on a privacy page linked from your footer. Keep it accurate: if you add a newsletter sign-up or analytics, update it.

## The ICO fee

Most businesses that handle personal information electronically need to pay a yearly data protection fee to the Information Commissioner’s Office. For most small businesses it’s the lowest tier. The ICO website has a short self-assessment to check whether you need to pay.

## Cookies: ask before tracking

Under the Privacy and Electronic Communications Regulations (PECR), you need visitors’ consent before setting cookies that aren’t strictly necessary, such as most advertising and some analytics tools. In practice:

- Tools like Google Analytics and the Meta Pixel need consent first, usually through a cookie banner
- Cookies a site needs to work, such as keeping someone logged in, don’t
- Privacy-friendly analytics that don’t use cookies or identify people generally don’t need a banner

Slate only shows a consent banner when you add a tool that needs one, and its own visitor stats don’t use cookies.

## Business information you must show

The Electronic Commerce Regulations say business websites should make some details easy to find, including:

- Your business name
- A geographic address where you’re established
- An email address
- Your VAT number, if you’re VAT registered
- Membership of any professional body or register you belong to, where relevant

Limited companies also have to show their registered company name, company number, place of registration (such as England and Wales) and registered office address on their website, under the Companies Act.

## Selling online

If people can buy from you online, the Consumer Contracts Regulations give them extra rights, such as a cooling-off period for many online purchases, and you need to give clear information about prices, delivery and cancellations before they buy.

## Accessibility

Under the Equality Act, businesses shouldn’t make it unreasonably hard for disabled people to use their services, and that includes websites. Good basics go a long way:

- Describe your images (alt text) so screen readers can explain them
- Use real headings, readable text sizes and good contrast
- Make sure forms have clear labels and error messages

## A quick checklist

- Privacy page that matches what your site actually collects
- ICO fee paid, if it applies to you
- Consent banner for tracking tools, if you use any
- Business name, address and email easy to find
- Company details on the site, if you’re a limited company
- Images described and forms clearly labelled`
    }
]

let added = 0
for (const [i, g] of GUIDES.entries()) {
    const [exists] = await sql`select id from posts where site_id = ${site.id} and slug = ${g.slug}`
    if (exists) continue
    const [cat] = await sql`select id from post_categories where site_id = ${site.id} and slug = ${g.category}`
    // Stagger the dates a little so the list has a sensible order
    const publishedAt = new Date(Date.now() - (GUIDES.length - i) * 3600_000)
    await sql`insert into posts (site_id, category_id, title, slug, excerpt, body, status, published_at, author_id)
        values (${site.id}, ${cat?.id ?? null}, ${g.title}, ${g.slug}, ${g.excerpt}, ${g.body}, 'published', ${publishedAt}, ${admin.id})`
    added++
}
console.log(`Added ${added} guide${added === 1 ? '' : 's'} (${GUIDES.length - added} already there)`)

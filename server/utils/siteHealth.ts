import { and, eq, isNull, lt, sql } from 'drizzle-orm'

/**
 * The site health check on Overview: plain-English things to fix, each linking to where to fix it.
 * Every check is cheap (a handful of queries over this site's own rows).
 */
export type HealthLevel = 'high' | 'medium' | 'low'
export interface HealthCheck {
    key: string
    ok: boolean
    level: HealthLevel
    title: string
    /** What it says once it's fine */
    okTitle: string
    detail: string
    /** Where to fix it, inside the site's CMS (e.g. '/seo') */
    to: string
    fixLabel: string
    /** Exactly what's affected, each with where to fix it */
    items?: HealthItem[]
    /** How many there are in total (items is capped) */
    count?: number
}
export interface HealthItem {
    label: string
    /** Where it is, or more about it */
    sub?: string
    /** Link inside the site's CMS */
    to?: string
    /** A thumbnail, for pictures */
    image?: string
}
const MAX_ITEMS = 25
const cap = (items: HealthItem[]) => ({ items: items.slice(0, MAX_ITEMS), count: items.length })

const WEIGHT: Record<HealthLevel, number> = { high: 20, medium: 10, low: 4 }
const BIG_IMAGE = 1.5 * 1024 * 1024

type Site = typeof schema.sites.$inferSelect

/** Every on-site link (starting with "/") in a block's settings, however deep. */
function linksIn(value: unknown, out: string[] = []): string[] {
    if (typeof value === 'string') {
        if (value.startsWith('/') && !value.startsWith('//')) out.push(value)
    } else if (Array.isArray(value)) {
        value.forEach(v => linksIn(v, out))
    } else if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) {
            // Image addresses (/media/…) aren't page links
            if (typeof v === 'string' && /image|cover|logo|photo|src/i.test(k)) continue
            linksIn(v, out)
        }
    }
    return out
}

/** Pictures in a page's blocks that have no description for screen readers, with where each one is. */
function picturesWithoutAlt(page: { id: string, title: string }, blocks: Block[]): HealthItem[] {
    const out: HealthItem[] = []
    const field = (key: string) => ({ image: 'Picture', image2: 'Second picture', image3: 'Third picture', cover: 'Cover picture', photo: 'Photo' } as Record<string, string>)[key] ?? 'Picture'
    const visit = (block: Block, props: Record<string, unknown>, where: string) => {
        for (const [k, v] of Object.entries(props)) {
            const m = k.match(/^(image\d?|cover|photo)Url$/)
            if (m && typeof v === 'string' && v && props[`${m[1]}Alt`] !== undefined && !String(props[`${m[1]}Alt`] ?? '').trim()) {
                out.push({ label: `${page.title} › ${findBlockType(block.type)?.name ?? block.type} block`, sub: `${where}${field(m[1]!)}`, image: v, to: `/pages/${page.id}?block=${block.id}` })
            }
            if (Array.isArray(v)) {
                v.forEach((item, i) => item && typeof item === 'object' && visit(block, item as Record<string, unknown>, `Item ${i + 1}: `))
            }
        }
    }
    blocks.forEach(b => visit(b, b.props, ''))
    return out
}

/**
 * Whether a domain already has Google's verification record in its DNS (a Search Console "Domain"
 * property). Asked over DNS-over-HTTPS; any failure just counts as "not found".
 */
async function googleVerifiedByDns(host: string) {
    const apex = host.replace(/^www\./, '')
    try {
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(apex)}&type=TXT`, {
            headers: { accept: 'application/dns-json' },
            signal: AbortSignal.timeout(3000)
        })
        const body = await res.json() as { Answer?: { data: string }[] }
        return (body.Answer ?? []).some(a => a.data.includes('google-site-verification='))
    } catch {
        return false
    }
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export async function siteHealth(site: Site) {
    const db = useDb()
    const [pages, posts, menus, media, oldReplies, forms, redirects, live] = await Promise.all([
        db.select({ id: schema.pages.id, title: schema.pages.title, path: schema.pages.path, kind: schema.pages.kind, status: schema.pages.status, noIndex: schema.pages.noIndex, seoDescription: schema.pages.seoDescription, shareImage: schema.pages.shareImage, blocks: schema.pages.blocks, publishedBlocks: schema.pages.publishedBlocks })
            .from(schema.pages).where(eq(schema.pages.siteId, site.id)),
        db.select({ slug: schema.posts.slug }).from(schema.posts).where(and(eq(schema.posts.siteId, site.id), eq(schema.posts.status, 'published'))),
        loadMenus(site.id),
        db.select({ key: schema.media.key, filename: schema.media.filename, size: schema.media.size, contentType: schema.media.contentType }).from(schema.media).where(eq(schema.media.siteId, site.id)),
        db.select({ n: sql<number>`count(*)::int` }).from(schema.formReplies)
            .where(and(eq(schema.formReplies.siteId, site.id), isNull(schema.formReplies.doneAt), lt(schema.formReplies.createdAt, new Date(Date.now() - 7 * 86400000)))),
        db.select({ n: sql<number>`count(*)::int` }).from(schema.forms).where(eq(schema.forms.siteId, site.id)),
        db.select({ fromPath: schema.redirects.fromPath }).from(schema.redirects).where(eq(schema.redirects.siteId, site.id)),
        liveAddress(site)
    ])
    const seo = site.seo ?? {}
    const theme = site.theme ?? {}
    const integrations = site.integrations ?? {}
    const visible = pages.filter(p => p.kind !== 'system' && p.status === 'published' && !p.noIndex)
    const checks: HealthCheck[] = []
    const add = (c: HealthCheck) => checks.push(c)

    // Offline
    add({ key: 'offline', ok: !site.offline, level: 'high', title: 'Your site is offline', okTitle: 'Your site is online', detail: 'Visitors see your Offline page instead of your site.', to: '/settings', fixLabel: 'Put it back online' })

    // Own domain
    const ownDomain = !!site.customDomain && live === site.customDomain
    add({ key: 'domain', ok: ownDomain, level: 'medium', title: 'Use your own domain', okTitle: 'Uses your own domain', detail: 'An address like yourbusiness.co.uk looks more trustworthy than a free Slate address, and is easier to remember.', to: '/domains', fixLabel: 'Get a domain' })

    // Broken internal links (blocks on published pages, plus menus)
    const valid = new Set<string>(['/', '/blog'])
    pages.filter(p => p.status === 'published' && p.kind !== 'system').forEach(p => valid.add(redirectKey(p.path)))
    posts.forEach(p => valid.add(`/blog/${p.slug}`))
    redirects.forEach(r => valid.add(r.fromPath))
    const broken = new Map<string, HealthItem>()
    const checkLink = (link: string, item: Omit<HealthItem, 'label'>) => {
        const key = redirectKey(link)
        if (key === '/' || valid.has(key) || /^\/(media|get-app|blog\?|#)/.test(link) || key.startsWith('/blog/category')) return
        const id = `${key}|${item.to}`
        if (!broken.has(id)) broken.set(id, { label: link, ...item })
    }
    for (const p of pages.filter(p => p.status === 'published' && p.publishedBlocks)) {
        for (const b of p.publishedBlocks!) {
            linksIn(b.props).forEach(l => checkLink(l, { sub: `On ${p.kind === 'system' ? `the ${p.title} page` : p.title} › ${findBlockType(b.type)?.name ?? b.type} block`, to: `/pages/${p.id}?block=${b.id}` }))
        }
    }
    for (const [slot, items] of Object.entries(menus) as [string, MenuItem[] | boolean][]) {
        if (Array.isArray(items)) items.forEach(i => i.url?.startsWith('/') && checkLink(i.url, { sub: `“${i.label}” in the ${slot} menu`, to: '/menus' }))
    }
    add({ key: 'links', ok: !broken.size, level: 'high', title: `${plural(broken.size, 'link goes', 'links go')} to a page that doesn’t exist`, okTitle: 'Every link goes somewhere', detail: 'Visitors clicking these see “Page not found”. Change the link, publish the page, or add a redirect.', to: '/pages', fixLabel: 'Fix links', ...cap([...broken.values()]) })

    // Unpublished changes
    const changed = pages.filter(p => p.status === 'published' && JSON.stringify(p.blocks) !== JSON.stringify(p.publishedBlocks))
    add({ key: 'unpublished', ok: !changed.length, level: 'medium', title: `${plural(changed.length, 'page has', 'pages have')} changes that aren’t live`, okTitle: 'Everything is published', detail: 'Visitors still see the older version until you publish.', to: '/pages', fixLabel: 'Review pages', ...cap(changed.map(p => ({ label: p.title, sub: p.path, to: `/pages/${p.id}` }))) })

    // Search: descriptions and share images
    const noDescription = seo.defaultDescription ? [] : visible.filter(p => !p.seoDescription)
    add({ key: 'descriptions', ok: !noDescription.length, level: 'medium', title: `${plural(noDescription.length, 'page has', 'pages have')} no description for Google`, okTitle: 'Every page has a description for Google', detail: 'Google shows a description under your page in search results. Without one, it picks some text itself.', to: '/seo', fixLabel: 'Add descriptions', ...cap(noDescription.map(p => ({ label: p.title, sub: p.path, to: `/seo?page=${p.id}` }))) })
    const noImage = seo.defaultShareImage ? [] : visible.filter(p => !p.shareImage)
    add({ key: 'shareImages', ok: !noImage.length, level: 'low', title: `${plural(noImage.length, 'page has', 'pages have')} no share image`, okTitle: 'Every page has a share image', detail: 'This is the picture shown when someone shares a link on WhatsApp, Facebook or LinkedIn.', to: '/seo', fixLabel: 'Add images', ...cap(noImage.map(p => ({ label: p.title, sub: p.path, to: `/seo?page=${p.id}` }))) })
    // Search Console: the HTML tag in Integrations, or Google's record in the domain's DNS
    const viaDns = !integrations.googleVerify && ownDomain ? await googleVerifiedByDns(live) : false
    add({ key: 'searchConsole', ok: !!integrations.googleVerify || viaDns, level: 'low', title: 'Connect Google Search Console', okTitle: viaDns ? 'Verified with Google Search Console (through your domain)' : 'Google Search Console is connected', detail: 'Free from Google: see which searches find you and spot problems early.', to: '/integrations?tab=search', fixLabel: 'Connect' })

    // Privacy policy (UK GDPR) when the site collects anything
    const collects = (forms[0]?.n ?? 0) > 0 || !!integrations.ga4 || !!integrations.metaPixel
    const hasPrivacy = pages.some(p => p.status === 'published' && /privacy/i.test(`${p.path} ${p.title}`))
    add({ key: 'privacy', ok: !collects || hasPrivacy, level: 'medium', title: 'Add a privacy policy', okTitle: hasPrivacy ? 'Has a privacy policy' : 'No privacy policy needed yet', detail: 'Your site collects details through forms or analytics, so UK law expects a page explaining what you keep and why.', to: '/pages', fixLabel: 'Add a page' })

    // Forms waiting
    const waiting = oldReplies[0]?.n ?? 0
    add({ key: 'replies', ok: !waiting, level: 'medium', title: `${plural(waiting, 'form reply has', 'form replies have')} been waiting over a week`, okTitle: 'No form replies left waiting', detail: 'Someone got in touch. Reply, or mark them as done.', to: '/forms', fixLabel: 'Open Forms' })

    // Pictures
    const big = media.filter(m => m.contentType.startsWith('image/') && m.size > BIG_IMAGE)
    const usedOn = (key: string) => pages.filter(p => JSON.stringify(p.publishedBlocks ?? p.blocks).includes(key) || p.shareImage?.includes(key)).map(p => p.title)
    const bigItems = big.map((m) => {
        const on = usedOn(m.key)
        return { label: m.filename, sub: `${(m.size / 1048576).toFixed(1)} MB · ${on.length ? `used on ${on.slice(0, 3).join(', ')}${on.length > 3 ? ` and ${on.length - 3} more` : ''}` : 'not used on any page'}`, image: mediaUrl(m.key), to: `/media?q=${encodeURIComponent(m.filename)}` }
    })
    add({ key: 'bigImages', ok: !big.length, level: 'low', title: `${plural(big.length, 'image is', 'images are')} very large`, okTitle: 'Images are a sensible size', detail: 'Big pictures make pages slow on phones, and Google ranks slow pages lower. Save a smaller copy (under 1 MB is plenty for most photos), upload it, and swap it in on the pages listed.', to: '/media', fixLabel: 'Open Media', ...cap(bigItems) })
    const altItems = visible.flatMap(p => picturesWithoutAlt(p, p.publishedBlocks ?? []))
    add({ key: 'alt', ok: !altItems.length, level: 'low', title: `${plural(altItems.length, 'picture has', 'pictures have')} no description`, okTitle: 'Pictures have descriptions', detail: 'Open each one and fill in its “description” box with a few words about what’s in the picture. It lets people using screen readers know what’s there, and helps Google too.', to: '/pages', fixLabel: 'Open Pages', ...cap(altItems) })

    // Look
    add({ key: 'favicon', ok: !!theme.favicon, level: 'low', title: 'Add a site icon', okTitle: 'Has a site icon', detail: 'The little picture in the browser tab and bookmarks. Without one, browsers show a blank page icon.', to: '/theme', fixLabel: 'Add an icon' })

    const score = Math.max(0, Math.round(100 - checks.filter(c => !c.ok).reduce((n, c) => n + WEIGHT[c.level], 0)))
    const order: Record<HealthLevel, number> = { high: 0, medium: 1, low: 2 }
    checks.sort((a, b) => Number(a.ok) - Number(b.ok) || order[a.level] - order[b.level])
    return { score, checks }
}

import { and, eq, inArray, sql } from 'drizzle-orm'

const MAX = 1000

/**
 * Adds redirects: { from, to, permanent? } for one, or { items: [{ from, to }] } for a pasted list.
 * Answers with what was added and, line by line, what wasn't and why. An old address that's
 * already redirected is updated to the new destination.
 */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const body = await readBody<{ from?: string, to?: string, permanent?: boolean, items?: { from?: string, to?: string }[] }>(event)
    const input = Array.isArray(body.items) ? body.items.slice(0, MAX) : [{ from: body.from, to: body.to }]
    const permanent = body.permanent !== false
    const db = useDb()

    const pages = await db.select({ path: schema.pages.path }).from(schema.pages).where(eq(schema.pages.siteId, site.id))
    const pagePaths = new Set(pages.map(p => redirectKey(p.path)))
    const skipped: { line: number, from: string, reason: string }[] = []
    const good = new Map<string, string>()
    input.forEach((item, i) => {
        const from = cleanRedirectFrom(item.from)
        const to = cleanRedirectTo(item.to)
        const label = String(item.from ?? '')
        if (!from) return skipped.push({ line: i + 1, from: label, reason: 'That old address can’t be redirected. Use something like /old-page.' })
        if (!to) return skipped.push({ line: i + 1, from: label, reason: 'Where it goes needs to be a page on your site (/new-page) or a full https:// link.' })
        if (pagePaths.has(from)) return skipped.push({ line: i + 1, from: label, reason: 'A page lives at that address, so visitors would see the page instead.' })
        if (to.startsWith('/') && redirectKey(to) === from) return skipped.push({ line: i + 1, from: label, reason: 'It points to itself.' })
        good.set(from, to)
    })
    if (!good.size) {
        if (!Array.isArray(body.items)) throw createError({ statusCode: 400, statusMessage: skipped[0]?.reason ?? 'Nothing to add.' })
        return { added: 0, skipped }
    }

    const [{ n } = { n: 0 }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.redirects).where(eq(schema.redirects.siteId, site.id))
    const existing = await db.select({ fromPath: schema.redirects.fromPath }).from(schema.redirects)
        .where(and(eq(schema.redirects.siteId, site.id), inArray(schema.redirects.fromPath, [...good.keys()])))
    if (n + good.size - existing.length > MAX) throw createError({ statusCode: 400, statusMessage: `A site can have up to ${MAX} redirects. Remove some you no longer need first.` })

    await db.insert(schema.redirects)
        .values([...good].map(([fromPath, toUrl]) => ({ siteId: site.id, fromPath, toUrl, permanent })))
        .onConflictDoUpdate({ target: [schema.redirects.siteId, schema.redirects.fromPath], set: { toUrl: sql`excluded.to_url`, permanent: sql`excluded.permanent` } })
    return { added: good.size, skipped }
})

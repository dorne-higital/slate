import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const name = String((await readBody<{ name?: string }>(event)).name ?? '').trim().slice(0, 60)
    if (!name) throw createError({ statusCode: 400, statusMessage: 'Give the category a name' })
    const slug = slugify(name) || 'category'
    const db = useDb()
    const existing = await db.query.postCategories.findFirst({ where: and(eq(schema.postCategories.siteId, site.id), eq(schema.postCategories.slug, slug)) })
    if (existing) return { ...existing, postCount: 0 }
    const [cat] = await db.insert(schema.postCategories).values({ siteId: site.id, name, slug }).returning()
    return { id: cat!.id, name: cat!.name, slug: cat!.slug, postCount: 0 }
})

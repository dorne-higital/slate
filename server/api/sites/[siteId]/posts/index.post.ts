export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const body = await readBody<{ title?: string }>(event)
    const title = String(body.title ?? '').trim().slice(0, 160) || 'Untitled post'
    const slug = await freePostSlug(site.id, title)
    const [post] = await useDb().insert(schema.posts).values({ siteId: site.id, title, slug, authorId: user.id }).returning()
    return toEditorPost(post!)
})

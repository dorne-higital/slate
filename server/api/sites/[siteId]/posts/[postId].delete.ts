import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const post = await requirePost(site.id, getRouterParam(event, 'postId')!)
    await useDb().delete(schema.posts).where(eq(schema.posts.id, post.id))
    return { ok: true }
})

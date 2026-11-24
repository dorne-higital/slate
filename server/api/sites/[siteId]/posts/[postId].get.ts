export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    return toEditorPost(await requirePost(site.id, getRouterParam(event, 'postId')!))
})

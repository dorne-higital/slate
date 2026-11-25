export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const slot = getRouterParam(event, 'slot') as MenuSlot
    if (!MENU_SLOTS.some(s => s.slot === slot)) throw createError({ statusCode: 404, statusMessage: 'No such menu' })

    const body = await readBody<{ items?: unknown }>(event)
    const items = cleanMenuItems(body.items, slot)
    await useDb()
        .insert(schema.menus)
        .values({ siteId: site.id, slot, items })
        .onConflictDoUpdate({ target: [schema.menus.siteId, schema.menus.slot], set: { items, updatedAt: new Date() } })
    return items
})

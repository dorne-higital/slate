export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const body = await readBody<Record<string, unknown>>(event)
    const clean = cleanFormInput({ fields: defaultContactFields(), ...body })
    const [form] = await useDb().insert(schema.forms).values({ siteId: site.id, ...clean }).returning()
    return { ...toFormDefinition(form!), total: 0, unread: 0, todo: 0 }
})

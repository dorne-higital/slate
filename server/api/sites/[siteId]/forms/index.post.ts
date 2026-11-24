import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const formCount = (await useDb().select({ id: schema.forms.id }).from(schema.forms).where(eq(schema.forms.siteId, site.id))).length
    await requireWithinPlan(site, l => formCount < l.formsPerSite, 'Your plan includes one form.')
    const body = await readBody<Record<string, unknown>>(event)
    const clean = cleanFormInput({ fields: defaultContactFields(), ...body })
    const [form] = await useDb().insert(schema.forms).values({ siteId: site.id, ...clean }).returning()
    return { ...toFormDefinition(form!), total: 0, unread: 0, todo: 0 }
})

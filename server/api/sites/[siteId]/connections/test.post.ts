/** Sends a made-up reply through one connection so the owner can see it arrive. */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const { key } = await readBody<{ key?: ConnectionKey }>(event)
    const conn = key ? site.connections?.[key] : undefined
    if (!key || !conn) throw createError({ statusCode: 400, statusMessage: 'Connect it first.' })

    let form: { id: string, name: string, fields: FormField[] } = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Test form',
        fields: [{ id: 'n', label: 'Your name', kind: 'text', required: true }, { id: 'e', label: 'Email', kind: 'email', required: true }, { id: 'm', label: 'Message', kind: 'textarea', required: false }]
    }
    let data: Record<string, string> = { 'Your name': 'Test Person', 'Email': 'test@example.com', 'Message': 'This is a test from Slate. You can delete it.' }
    if ('formId' in conn) {
        // Email lists: a real form, and the address of the person testing so nothing fake joins the list
        const real = await useDb().query.forms.findFirst({ where: (f, { and, eq }) => and(eq(f.id, conn.formId), eq(f.siteId, site.id)) })
        if (!real) throw createError({ statusCode: 400, statusMessage: 'Choose the form again in the settings.' })
        form = { id: real.id, name: real.name, fields: real.fields }
        const email = real.fields.find(f => f.kind === 'email')!
        const name = real.fields.find(f => f.kind === 'text' && /name/i.test(f.label))
        data = { [email.label]: user.email, ...(name ? { [name.label]: user.name } : {}) }
    }
    const [result] = await sendReplyToConnections({ site, form, data, page: '/', replyId: 'test', address: await liveAddress(site), sentAt: new Date() }, key)
    if (!result) throw createError({ statusCode: 400, statusMessage: 'Nothing to send.' })
    if (result[1]) throw createError({ statusCode: 502, statusMessage: result[1] })
    return { ok: true, message: 'formId' in conn ? `Sent. ${user.email} should now be on ${conn.listName}.` : 'Sent. Check it arrived.' }
})

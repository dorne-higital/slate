import { eq } from 'drizzle-orm'

type Body = { key?: ConnectionKey, remove?: boolean, url?: string, apiKey?: string, listId?: string, formId?: string }
const KEYS: ConnectionKey[] = ['webhook', 'slack', 'discord', 'mailchimp', 'brevo']
const NAMES: Record<ConnectionKey, string> = { webhook: 'webhook', slack: 'Slack webhook', discord: 'Discord webhook', mailchimp: 'Mailchimp', brevo: 'Brevo' }

/**
 * Connect, change or remove one secret-backed integration.
 * Webhooks take { url }. Email lists take { apiKey?, listId, formId }: leave apiKey out to keep the saved one.
 */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const body = await readBody<Body>(event)
    const key = body.key
    if (!key || !KEYS.includes(key)) throw createError({ statusCode: 400, statusMessage: 'Unknown integration' })

    const next: SiteConnections = { ...(site.connections ?? {}) }
    if (body.remove) {
        delete next[key]
    } else {
        await requireWithinPlan(site, connectionsAllowed, 'Webhooks, chat alerts and email lists come with the Business and Studio plans.')
        if (key === 'webhook' || key === 'slack' || key === 'discord') {
            const url = cleanConnectionUrl(key, body.url)
            if (!url) {
                throw createError({ statusCode: 400, statusMessage: key === 'webhook'
                    ? 'Use a full https:// address, like the one Zapier or Make gives you.'
                    : `That doesn’t look like a ${NAMES[key]} address. Copy it again from ${key === 'slack' ? 'Slack' : 'Discord'}.` })
            }
            next[key] = { url }
        } else {
            const saved = site.connections?.[key]
            const apiKey = typeof body.apiKey === 'string' && body.apiKey.trim() ? body.apiKey.trim() : saved?.apiKey
            if (!apiKey) throw createError({ statusCode: 400, statusMessage: `Paste your ${NAMES[key]} API key first.` })
            const lists = await emailLists(key, apiKey)
            const list = lists.find(l => l.id === body.listId)
            if (!list) throw createError({ statusCode: 400, statusMessage: `Choose which ${key === 'mailchimp' ? 'audience' : 'list'} to add people to.` })
            const forms = await formsWithEmail(site.id)
            if (!forms.some(f => f.id === body.formId)) throw createError({ statusCode: 400, statusMessage: 'Choose a form with an email field.' })
            next[key] = { apiKey, listId: list.id, listName: list.name, formId: body.formId! }
        }
    }
    await useDb().update(schema.sites).set({ connections: next, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
    return connectionsView(next)
})

import { eq } from 'drizzle-orm'

/**
 * Integrations that need a secret: form replies sent to a webhook, Slack or Discord,
 * and sign-up forms that add people to Mailchimp or Brevo. Secrets stay in sites.connections
 * and the CMS only ever sees connectionsView().
 */
type Site = typeof schema.sites.$inferSelect
type Form = { id: string, name: string, fields: FormField[] }
export interface ListOption { id: string, name: string }

const TIMEOUT = 8000

export function connectionsView(c: SiteConnections | null | undefined): SiteConnectionsView {
    const out: SiteConnectionsView = {}
    for (const [key, v] of Object.entries(c ?? {}) as [ConnectionKey, NonNullable<SiteConnections[ConnectionKey]>][]) {
        const secret = 'url' in v ? v.url : v.apiKey
        out[key] = {
            hint: maskSecret(secret),
            ...('listName' in v ? { listName: v.listName, formId: v.formId } : {}),
            lastError: v.lastError,
            lastErrorAt: v.lastErrorAt,
            lastOkAt: v.lastOkAt
        }
    }
    return out
}

// ── Email lists ──

export const MAILCHIMP_KEY = /^[0-9a-f]{32}-[a-z]+\d+$/
export const BREVO_KEY = /^xkeysib-[0-9a-f]{64}-[A-Za-z0-9]{16}$/

const mailchimpBase = (apiKey: string) => `https://${apiKey.split('-')[1]}.api.mailchimp.com/3.0`
const mailchimpAuth = (apiKey: string) => ({ authorization: `Basic ${btoa(`slate:${apiKey}`)}` })

/** The audiences (Mailchimp) or lists (Brevo) this key can see. Throws a readable error if the key is wrong. */
export async function emailLists(kind: 'mailchimp' | 'brevo', apiKey: string): Promise<ListOption[]> {
    if (kind === 'mailchimp') {
        if (!MAILCHIMP_KEY.test(apiKey)) throw createError({ statusCode: 400, statusMessage: 'That doesn’t look like a Mailchimp API key. It ends with something like -us21.' })
        const res = await fetch(`${mailchimpBase(apiKey)}/lists?count=100&fields=lists.id,lists.name`, { headers: mailchimpAuth(apiKey), signal: AbortSignal.timeout(TIMEOUT) }).catch(() => null)
        if (!res?.ok) throw createError({ statusCode: 400, statusMessage: 'Mailchimp didn’t accept that key. Check you copied all of it, or make a new one.' })
        const body = await res.json() as { lists: { id: string, name: string }[] }
        return body.lists.map(l => ({ id: l.id, name: l.name }))
    }
    if (!BREVO_KEY.test(apiKey)) throw createError({ statusCode: 400, statusMessage: 'That doesn’t look like a Brevo API key. It starts with xkeysib-.' })
    const res = await fetch('https://api.brevo.com/v3/contacts/lists?limit=50&offset=0', { headers: { 'api-key': apiKey, accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT) }).catch(() => null)
    if (!res?.ok) {
        throw createError({ statusCode: 400, statusMessage: res?.status === 401
            ? 'Brevo didn’t accept that key. If it’s right, turn off “authorised IPs” under Security in Brevo, then try again.'
            : 'Brevo didn’t accept that key. Check you copied all of it, or make a new one.' })
    }
    const body = await res.json() as { lists?: { id: number, name: string }[] }
    return (body.lists ?? []).map(l => ({ id: String(l.id), name: l.name }))
}

/** Pulls a name out of the reply: "First name"/"Last name" fields, or one "Name" field split in two. */
export function replyName(form: Form, data: Record<string, string>) {
    const value = (re: RegExp) => {
        const f = form.fields.find(x => x.kind === 'text' && re.test(x.label))
        return f ? (data[f.label] ?? '').trim() : ''
    }
    const first = value(/^first\s*name|^forename/i)
    const last = value(/^(last\s*name|surname|family\s*name)/i)
    if (first || last) return { first, last }
    const full = value(/name/i)
    const [f = '', ...rest] = full.split(/\s+/)
    return { first: f, last: rest.join(' ') }
}

async function addToList(kind: 'mailchimp' | 'brevo', c: { apiKey: string, listId: string }, email: string, name: { first: string, last: string }) {
    if (kind === 'mailchimp') {
        const merge: Record<string, string> = {}
        if (name.first) merge.FNAME = name.first
        if (name.last) merge.LNAME = name.last
        const res = await fetch(`${mailchimpBase(c.apiKey)}/lists/${encodeURIComponent(c.listId)}/members`, {
            method: 'POST',
            headers: { ...mailchimpAuth(c.apiKey), 'content-type': 'application/json' },
            body: JSON.stringify({ email_address: email, status: 'subscribed', merge_fields: merge }),
            signal: AbortSignal.timeout(TIMEOUT)
        })
        if (res.ok) return
        const err = await res.json().catch(() => ({})) as { title?: string, detail?: string }
        if (err.title === 'Member Exists') return
        throw new Error(`Mailchimp: ${err.detail || err.title || res.status}`)
    }
    const attributes: Record<string, string> = {}
    if (name.first) attributes.FIRSTNAME = name.first
    if (name.last) attributes.LASTNAME = name.last
    const res = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'api-key': c.apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email, attributes, listIds: [Number(c.listId)], updateEnabled: true }),
        signal: AbortSignal.timeout(TIMEOUT)
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(`Brevo: ${err.message || res.status}`)
    }
}

// ── Chat and webhooks ──

const slackEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const cut = (s: string, n: number) => s.length > n ? `${s.slice(0, n - 1)}…` : s

async function post(url: string, body: unknown, label: string) {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Slate-Webhooks/1.0' }, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT) })
    if (res.ok) return
    if (res.status === 404 || res.status === 410) throw new Error(`${label} says that address doesn’t exist any more. Copy a new one and save it here.`)
    if (res.status === 401 || res.status === 403) throw new Error(`${label} refused it (${res.status}). Check the address is still allowed to post.`)
    throw new Error(`${label} answered ${res.status}`)
}

export interface ReplyForConnections {
    site: Site
    form: Form
    data: Record<string, string>
    page: string | null
    replyId: string
    address: string
    sentAt: Date
}

function webhookBody(r: ReplyForConnections) {
    return {
        type: 'form.reply',
        site: { id: r.site.id, name: r.site.name, address: `https://${r.address}` },
        form: { id: r.form.id, name: r.form.name },
        reply: {
            id: r.replyId,
            page: r.page,
            sentAt: r.sentAt.toISOString(),
            answers: r.data,
            fields: r.form.fields.filter(f => f.kind !== 'step').map(f => ({ label: f.label, kind: f.kind, value: r.data[f.label] ?? '' }))
        }
    }
}

function slackBody(r: ReplyForConnections) {
    const rows = Object.entries(r.data).map(([k, v]) => `*${slackEsc(k)}*\n${slackEsc(cut(v, 1500))}`)
    const head = `New reply to *${slackEsc(r.form.name)}* on ${slackEsc(r.site.name)}${r.page ? ` (${slackEsc(r.page)})` : ''}`
    return {
        text: `New reply to ${r.form.name}`,
        blocks: [
            { type: 'section', text: { type: 'mrkdwn', text: head } },
            ...rows.slice(0, 40).map(t => ({ type: 'section', text: { type: 'mrkdwn', text: cut(t, 2900) } })),
            { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Open in Slate' }, url: appUrl(`/sites/${r.site.id}/forms?reply=${r.replyId}`) }] }
        ]
    }
}

function discordBody(r: ReplyForConnections) {
    return {
        username: 'Slate',
        allowed_mentions: { parse: [] },
        embeds: [{
            title: cut(`New reply to ${r.form.name}`, 250),
            description: cut(`${r.site.name}${r.page ? ` · ${r.page}` : ''}`, 500),
            url: appUrl(`/sites/${r.site.id}/forms?reply=${r.replyId}`),
            color: 0x1f2a37,
            fields: Object.entries(r.data).slice(0, 25).map(([k, v]) => ({ name: cut(k, 250), value: cut(v || '–', 1000) })),
            timestamp: r.sentAt.toISOString()
        }]
    }
}

/** Sends one reply through one connection. Throws with a short reason on failure; returns false if it didn't apply. */
async function sendOne(key: ConnectionKey, c: NonNullable<SiteConnections[ConnectionKey]>, r: ReplyForConnections): Promise<boolean> {
    if (key === 'webhook') await post((c as { url: string }).url, webhookBody(r), 'The webhook')
    else if (key === 'slack') await post((c as { url: string }).url, slackBody(r), 'Slack')
    else if (key === 'discord') await post((c as { url: string }).url, discordBody(r), 'Discord')
    else {
        const list = c as { apiKey: string, listId: string, formId: string }
        if (list.formId !== r.form.id) return false
        const emailField = r.form.fields.find(f => f.kind === 'email')
        const email = emailField ? (r.data[emailField.label] ?? '').trim() : ''
        if (!email) return false
        await addToList(key, list, email, replyName(r.form, r.data))
    }
    return true
}

/** Records how each connection got on, without overwriting changes made meanwhile. */
async function recordResults(siteId: string, results: [ConnectionKey, string | null][]) {
    if (!results.length) return
    const db = useDb()
    const fresh = await db.query.sites.findFirst({ where: eq(schema.sites.id, siteId), columns: { connections: true } })
    const next: SiteConnections = { ...(fresh?.connections ?? {}) }
    const now = new Date().toISOString()
    for (const [key, error] of results) {
        const c = next[key]
        if (!c) continue
        next[key] = (error ? { ...c, lastError: cut(error, 200), lastErrorAt: now } : { ...c, lastOkAt: now, lastError: undefined, lastErrorAt: undefined }) as never
    }
    await db.update(schema.sites).set({ connections: next }).where(eq(schema.sites.id, siteId))
}

/** Sends a new form reply to every connection the site has. Never throws: failures are recorded for the owner to see. */
export async function sendReplyToConnections(r: ReplyForConnections, only?: ConnectionKey) {
    const entries = (Object.entries(r.site.connections ?? {}) as [ConnectionKey, NonNullable<SiteConnections[ConnectionKey]>][])
        .filter(([k]) => !only || k === only)
    if (!entries.length) return []
    const results = await Promise.all(entries.map(async ([key, c]): Promise<[ConnectionKey, string | null] | null> => {
        try {
            return await sendOne(key, c, r) ? [key, null] : null
        } catch (err) {
            return [key, err instanceof Error ? (err.name === 'TimeoutError' ? 'Took too long to answer' : err.message) : 'Couldn’t send']
        }
    }))
    const done = results.filter(Boolean) as [ConnectionKey, string | null][]
    await recordResults(r.site.id, done).catch(() => {})
    return done
}

/** The form fields an email-list connection can use: forms on this site with an email field. */
export async function formsWithEmail(siteId: string) {
    const forms = await useDb().query.forms.findMany({ where: eq(schema.forms.siteId, siteId), columns: { id: true, name: true, fields: true } })
    return forms.filter(f => (f.fields as FormField[]).some(x => x.kind === 'email')).map(f => ({ id: f.id, name: f.name }))
}

/**
 * Slate's own email: everything sent to @slatecms.co.uk (hello@ and anything else) forwards to Dan's private inbox.
 * The inbox is the Worker secret NUXT_SLATE_MAIL_TO, so it's never in the code or on any page.
 * Uses the domain-zones token, which can change email settings (the local key can't).
 */
export interface SlateEmailStatus {
    /** The private inbox is set and the email settings can be changed */
    ready: boolean
    /** slatecms.co.uk has mail records, so mail is accepted */
    receiving: boolean
    /** Everything @slatecms.co.uk is forwarded */
    forwarding: boolean
    /** The private inbox has pressed Cloudflare's confirmation link */
    confirmed: boolean
}

const apex = () => stripPort(useRuntimeConfig().public.appHost)

async function hasMailRecords(domain: string) {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, { headers: { accept: 'application/dns-json' } }).catch(() => null)
    const data = await res?.json().catch(() => null) as { Answer?: unknown[] } | null
    return !!data?.Answer?.length
}

export async function slateEmailStatus(): Promise<SlateEmailStatus> {
    const config = useRuntimeConfig()
    const to = config.slateMailTo
    const ready = !!to && domainZonesEnabled() && !!config.cloudflareZoneId
    const receiving = await hasMailRecords(apex())
    if (!ready) return { ready, receiving, forwarding: false, confirmed: false }
    const all = (await listEmailForwards(config.cloudflareZoneId, apex()).catch(() => [])).find(f => f.from === '*' && f.to.toLowerCase() === to.toLowerCase())
    return { ready, receiving, forwarding: !!all, confirmed: !!all?.confirmed }
}

/** Switches on email for slatecms.co.uk and sends everything to the private inbox. Safe to repeat. */
export async function setUpSlateEmail() {
    const config = useRuntimeConfig()
    if (!config.slateMailTo) throw createError({ statusCode: 400, statusMessage: 'Set the NUXT_SLATE_MAIL_TO Worker secret first.' })
    await addEmailForward(config.cloudflareZoneId, apex(), '*', config.slateMailTo)
}

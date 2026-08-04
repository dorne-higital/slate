import { requireSiteAccess } from '../../../utils/requireSiteAccess'
import { domainCounterpart, getDomainStatus, suggestedDnsRecord } from '../../../utils/vercelDomains'

/**
 * Live Verified/Pending check + the DNS records to show — what the
 * Settings page's "Recheck" button calls. Reports both the canonical
 * domain the customer typed and its auto-registered www/apex sibling —
 * each needs its own separate DNS record at the registrar, so both need
 * their own status shown, not just the one the customer typed.
 */
export default defineEventHandler(async (event) => {
    const siteId = getRouterParam(event, 'siteId')

    if (!siteId) {
        throw createError({ statusCode: 400, statusMessage: 'siteId is required' })
    }

    const { client } = await requireSiteAccess(event, siteId, 'viewer')

    const { data: site, error } = await client.from('sites').select('custom_domain').eq('id', siteId).single()

    if (error || !site) {
        throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    }

    if (!site.custom_domain) {
        return { hasDomain: false as const }
    }

    const counterpart = domainCounterpart(site.custom_domain)

    const [status, counterpartStatus] = await Promise.all([
        getDomainStatus(site.custom_domain),
        getDomainStatus(counterpart).catch(() => ({ verified: false, verification: [] }))
    ])

    return {
        hasDomain: true as const,
        domain: site.custom_domain,
        verified: status.verified,
        record: suggestedDnsRecord(site.custom_domain),
        counterpart,
        counterpartVerified: counterpartStatus.verified,
        counterpartRecord: suggestedDnsRecord(counterpart)
    }
})

import { toValue, type MaybeRefOrGetter } from 'vue'

/**
 * The Host header of the real domain a request arrived on, when it got
 * here via resolve-tenant-domain.ts rewriting a subdomain/custom-domain
 * request in place (see that file for why) — undefined for a request
 * that hit this route directly at its real internal path. useState (not
 * a plain computed off useRequestEvent) because this value is also
 * needed client-side, after hydration, where there is no request event
 * to read the header from — useState carries the server-computed value
 * across in the payload.
 */
export function useTenantHost() {
    const requestEvent = useRequestEvent()

    return useState<string | undefined>('slate-tenant-host', () => {
        const header = requestEvent?.node.req.headers['x-slate-tenant-domain']
        return typeof header === 'string' ? header : undefined
    })
}

/**
 * Cosmetically corrects the address bar for a page reached via the
 * tenant-rewrite trick, without disturbing Vue Router's hydrated route.
 *
 * Vue Router's hydration deliberately keeps its internal route as this
 * component's real one (e.g. /preview/{slug}/... or /sites/{id}/...) —
 * that has to stay intact, or Vue Router re-resolves the actual browser
 * URL against the route table on mount, which matches a different page
 * (the marketing homepage, or nothing), and visitors get bounced
 * somewhere wrong. Fixing the address bar is therefore done here
 * instead, client-side only, purely cosmetically: history.replaceState()
 * changes what's displayed without going through
 * router.replace()/navigateTo(), so it never triggers route
 * re-resolution.
 */
export function useTenantAddressBarFix(basePath: MaybeRefOrGetter<string>) {
    const tenantHost = useTenantHost()
    const route = useRoute()

    const realPath = computed(() => {
        const base = toValue(basePath)
        return route.fullPath.slice(base.length) || '/'
    })

    onMounted(() => {
        if (tenantHost.value) {
            history.replaceState(history.state, '', realPath.value)
        }
    })

    return { tenantHost, realPath }
}

import type { RouterConfig } from '@nuxt/schema'
import { isAppHost } from '../shared/utils/hosts'

/**
 * One app, two route sets, picked by hostname:
 *  - Slate's own host gets the marketing site and CMS (everything except /_site).
 *  - Any other host (a client's free address or custom domain) gets only pages/_site,
 *    mounted at the root, so bramble.slatecms.co.uk/services renders their Services page.
 * Server and client pick the same set, so hydration always matches.
 */
export default {
    routes: (routes) => {
        const host = import.meta.server ? useRequestURL().host : window.location.host
        const { appHost } = useRuntimeConfig().public
        if (isAppHost(host, appHost)) return routes.filter(r => !r.path.startsWith('/_site'))
        return routes
            .filter(r => r.path.startsWith('/_site'))
            .map(r => ({ ...r, path: r.path.replace(/^\/_site/, '') || '/' }))
    }
} satisfies RouterConfig

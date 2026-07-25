<template>
    <div class="preview">
        <p v-if="pending" class="preview__status" role="status">Loading…</p>

        <div v-else-if="error" class="preview__status" role="alert">
            <h1 class="preview__error-title">Page not found</h1>
            <p>This page doesn't exist, or hasn't been published yet.</p>
        </div>

        <BlockRenderer v-else-if="data" :blocks="data.page.blocks" :theme="data.site.theme" />
    </div>
</template>

<script setup lang="ts">
import type { Block, SiteTheme } from '../../../types'
import { googleFontLinksFor } from '../../../utils/siteFonts'

definePageMeta({ layout: 'preview' })

interface SitePageResponse {
    site: { id: string, name: string, slug: string, theme: SiteTheme | null }
    page: {
        id: string
        parent_id: string | null
        slug: string
        title: string
        seo_title: string | null
        seo_description: string | null
        blocks: Block[]
    }
}

const route = useRoute()
const siteSlug = String(route.params.siteSlug)
const pathSegments = Array.isArray(route.params.path) ? route.params.path : []

const { data, pending, error } = await useFetch<SitePageResponse>('/api/public/site-page', {
    query: { siteSlug, path: pathSegments.join('/') }
})

// This route is reachable two ways: directly at /preview/... (a staging
// URL, kept out of search results) and — once a site has a custom_domain
// — via the tenant-resolution middleware rewriting a real visitor's
// request here invisibly and setting this header. Only the latter should
// be indexable. useState (not a plain computed off useRequestEvent)
// because this value is also needed client-side, after hydration, where
// there is no request event to read the header from — useState carries
// the server-computed value across in the payload.
const requestEvent = useRequestEvent()
const tenantHost = useState<string | undefined>('slate-tenant-host', () => {
    const header = requestEvent?.node.req.headers['x-slate-tenant-domain']
    return typeof header === 'string' ? header : undefined
})
const viaCustomDomain = computed(() => Boolean(tenantHost.value))

// route.fullPath here is this component's own /preview/{siteSlug}/...
// route (query/hash included) — real visitors never see that, they hit
// tenantHost at this page's path directly, so canonical/OG URLs need to
// be built from that instead or they'd point search engines/crawlers at
// a URL that doesn't actually exist for them.
const realPath = computed(() => route.fullPath.slice(`/preview/${siteSlug}`.length) || '/')
const canonicalUrl = computed(() => (tenantHost.value ? `https://${tenantHost.value}${realPath.value}` : undefined))

useHead({
    link: () => (canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : [])
})

// If this site's theme picked a Google Font, real visitors need it
// actually loaded — same call the theme editor's own live preview and
// the page builder canvas make for their theme.
useHead({ link: () => googleFontLinksFor(data.value?.site.theme) })

useSeoMeta({
    title: () => data.value?.page.seo_title || data.value?.page.title,
    description: () => data.value?.page.seo_description ?? undefined,
    robots: () => (viaCustomDomain.value ? 'index, follow' : 'noindex, nofollow'),
    ogUrl: () => canonicalUrl.value
})

// Vue Router's own hydration deliberately keeps its internal route as
// this component's real one (/preview/{siteSlug}/...) — that has to
// stay intact, or Vue Router re-resolves the actual browser URL against
// the route table on mount, which matches pages/index.vue (the admin
// app's own '/'), not this page, and visitors get bounced to /login.
// Fixing the address bar is therefore done here instead, client-side
// only, purely cosmetically: history.replaceState() changes what's
// displayed without going through router.replace()/navigateTo(), so it
// never triggers route re-resolution — Vue Router keeps rendering this
// component exactly as hydrated, the visitor just sees their own domain
// in the bar instead of /preview/{siteSlug}.
onMounted(() => {
    if (tenantHost.value) {
        history.replaceState(history.state, '', realPath.value)
    }
})
</script>

<style lang="scss" scoped>
.preview {
    margin: 0 auto;
    max-width: 72rem;
    padding: $space-6;

    &__status {
        color: $color-text-muted;
        padding: $space-8 0;
        text-align: center;
    }

    &__error-title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-2xl;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }
}
</style>

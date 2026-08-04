<template>
    <div class="preview">
        <component
            :is="headerComponent"
            v-if="!pending && !error && data"
            :site-name="data.site.name"
            :items="headerMainItems"
        />

        <div class="preview__content">
            <p v-if="pending" class="preview__status" role="status">Loading…</p>

            <div v-else-if="error" class="preview__status" role="alert">
                <h1 class="preview__error-title">Page not found</h1>
                <p>This page doesn't exist, or hasn't been published yet.</p>
            </div>

            <BlockRenderer v-else-if="data" :blocks="data.page.blocks" :theme="data.site.theme" />
        </div>

        <component
            :is="footerComponent"
            v-if="!pending && !error && data"
            :site-name="data.site.name"
            :main-items="footerMainItems"
            :legal-items="footerLegalItems"
        />
    </div>
</template>

<script setup lang="ts">
import type { Block, Menu, MenuItem, MenuSlot, SiteLayout, SiteTheme } from '../../../types'
import { googleFontLinksFor } from '../../../utils/siteFonts'
import { resolveFooterStyleComponent, resolveHeaderStyleComponent } from '../../../utils/siteLayoutComponents'

definePageMeta({ layout: 'preview' })

interface SitePageResponse {
    site: { id: string, name: string, slug: string, theme: SiteTheme | null, layout: SiteLayout | null }
    page: {
        id: string
        parent_id: string | null
        slug: string
        title: string
        seo_title: string | null
        seo_description: string | null
        blocks: Block[]
    }
    menus: Menu[]
}

const route = useRoute()
const siteSlug = String(route.params.siteSlug)
const pathSegments = Array.isArray(route.params.path) ? route.params.path : []

const { data, pending, error } = await useFetch<SitePageResponse>('/api/public/site-page', {
    query: { siteSlug, path: pathSegments.join('/') }
})

const headerComponent = computed(() => resolveHeaderStyleComponent(data.value?.site.layout?.header))
const footerComponent = computed(() => resolveFooterStyleComponent(data.value?.site.layout?.footer))

function menuItemsFor(slot: MenuSlot): MenuItem[] {
    return data.value?.menus.find(menu => menu.slot === slot)?.items ?? []
}

const headerMainItems = computed(() => menuItemsFor('header_main'))
const footerMainItems = computed(() => menuItemsFor('footer_main'))
const footerLegalItems = computed(() => menuItemsFor('footer_legal'))

// This route is reachable two ways: directly at /preview/... (a staging
// URL, kept out of search results) and — once a site has a custom_domain
// or subdomain — via the tenant-resolution middleware rewriting a real
// visitor's request here invisibly. Only the latter should be indexable.
//
// route.fullPath here is this component's own /preview/{siteSlug}/...
// route (query/hash included) — real visitors never see that, they hit
// tenantHost at this page's path directly, so canonical/OG URLs need to
// be built from that instead or they'd point search engines/crawlers at
// a URL that doesn't actually exist for them.
const { tenantHost, realPath } = useTenantAddressBarFix(`/preview/${siteSlug}`)
const viaCustomDomain = computed(() => Boolean(tenantHost.value))
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
</script>

<style lang="scss" scoped>
.preview {
    display: flex;
    flex-direction: column;
    min-height: 100vh;

    &__content {
        flex: 1;
        margin: 0 auto;
        max-width: 72rem;
        padding: $space-6;
        width: 100%;
    }

    &__status {
        color: $color-text-muted;
        padding: $space-8 0;
        text-align: center;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
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

<template>
    <div class="preview">
        <p v-if="pending" class="preview__status" role="status">Loading…</p>

        <div v-else-if="error" class="preview__status" role="alert">
            <h1 class="preview__error-title">Page not found</h1>
            <p>This page doesn't exist, or hasn't been published yet.</p>
        </div>

        <BlockRenderer v-else-if="data" :blocks="data.page.blocks" />
    </div>
</template>

<script setup lang="ts">
import type { Block } from '../../../types'

definePageMeta({ layout: 'preview' })

interface SitePageResponse {
    site: { id: string, name: string, slug: string }
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
// be indexable.
const requestEvent = useRequestEvent()
const viaCustomDomain = computed(() => Boolean(requestEvent?.node.req.headers['x-slate-tenant-domain']))

useSeoMeta({
    title: () => data.value?.page.seo_title || data.value?.page.title,
    description: () => data.value?.page.seo_description ?? undefined,
    robots: () => (viaCustomDomain.value ? 'index, follow' : 'noindex, nofollow')
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

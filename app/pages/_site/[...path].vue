<script setup lang="ts">
// A client's public page. Only reachable on a client host (see app/router.options.ts).
definePageMeta({ layout: false })
const route = useRoute()
const fetcher = useRequestFetch()
const path = computed(() => {
    const parts = route.params.path
    return '/' + (Array.isArray(parts) ? parts.join('/') : (parts ?? ''))
})

const { data, error } = await useAsyncData(() => `public-${path.value}`, () => fetcher('/api/public/page', { query: { path: path.value } }), { watch: [path] })
if (error.value && !data.value) {
    throw createError({ statusCode: error.value.statusCode ?? 404, statusMessage: 'Page not found', fatal: true })
}

// Canonical uses the site's live address, so free-address and www copies point search engines at one URL
useSiteSeo(() => {
    if (!data.value) return null
    const { site, page } = data.value
    return {
        title: fullTitle(page, site.name, site.seo),
        shortTitle: page.seoTitle || page.title,
        description: page.seoDescription || site.seo.defaultDescription,
        image: page.shareImage || site.seo.defaultShareImage,
        url: `https://${site.address}${page.path}`,
        siteName: site.name,
        noIndex: page.noIndex
    }
})

provide('siteForms', computed(() => data.value?.forms ?? {}))
provide('sitePosts', computed(() => data.value?.posts ?? []))
</script>

<template>
    <SiteShell v-if="data" :site="data.site" :menus="data.menus">
        <BlockRenderer :blocks="data.page.blocks" />
    </SiteShell>
</template>

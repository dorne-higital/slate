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
// The site's own "Page not found" page: still a 404 for browsers and search engines
if (import.meta.server && data.value?.notFound) setResponseStatus(useRequestEvent()!, 404)
// The Offline page: "back soon" for browsers and search engines, so the site keeps its place in search
if (import.meta.server && data.value?.offline) {
    const event = useRequestEvent()!
    setResponseStatus(event, 503)
    event.node.res.setHeader('retry-after', '3600')
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
        url: `https://${site.address}${data.value.notFound || data.value.offline ? path.value : page.path}`,
        siteName: site.name,
        noIndex: page.noIndex
    }
})

provide('siteForms', computed(() => data.value?.forms ?? {}))
provide('sitePosts', computed(() => data.value?.posts ?? []))
provide('siteProjects', computed(() => data.value?.projects ?? []))
</script>

<template>
    <SiteShell v-if="data" :site="data.site" :menus="data.menus">
        <ProjectHeader v-if="data.page.project" :title="data.page.title" :project="data.page.project" />
        <BlockRenderer :blocks="data.page.blocks" />
    </SiteShell>
</template>

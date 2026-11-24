<script setup lang="ts">
// A client's public site. Only reachable on a client host (see app/router.options.ts).
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
const seo = computed(() => {
    if (!data.value) return null
    const { site, page } = data.value
    return {
        title: fullTitle(page, site.name, site.seo),
        shortTitle: page.seoTitle || page.title,
        description: page.seoDescription || site.seo.defaultDescription || undefined,
        image: page.shareImage || site.seo.defaultShareImage || undefined,
        url: `https://${site.address}${page.path}`,
        siteName: site.name,
        noIndex: page.noIndex
    }
})
useSeoMeta({
    title: () => seo.value?.title ?? '',
    description: () => seo.value?.description,
    ogTitle: () => seo.value?.shortTitle,
    ogDescription: () => seo.value?.description,
    ogImage: () => seo.value?.image,
    ogUrl: () => seo.value?.url,
    ogSiteName: () => seo.value?.siteName,
    ogType: 'website',
    twitterCard: () => (seo.value?.image ? 'summary_large_image' : 'summary'),
    robots: () => (seo.value?.noIndex ? 'noindex' : undefined)
})
useHead(() => ({
    link: data.value
        ? [{ rel: 'canonical', href: seo.value!.url }, { rel: 'stylesheet', href: themeFontsHref(data.value.site.theme) }]
        : []
}))

const themeVars = computed(() => siteThemeVars(data.value?.site.theme))
provide('siteForms', computed(() => data.value?.forms ?? {}))
</script>

<template>
    <div v-if="data" class="site" :style="themeVars">
        <SiteHeader :name="data.site.name" :items="data.menus.header" />
        <main>
            <BlockRenderer :blocks="data.page.blocks" />
        </main>
        <SiteFooter :name="data.site.name" :items="data.menus.footer" :legal="data.menus.legal" />
    </div>
</template>

<style scoped>
.site { background: var(--site-bg); color: var(--site-text); display: flex; flex-direction: column; font-family: var(--site-body-font); min-height: 100vh; }
main { flex: 1; }
</style>

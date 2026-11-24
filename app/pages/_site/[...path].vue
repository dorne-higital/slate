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

useHead(() => ({
    title: data.value ? `${data.value.page.seoTitle || data.value.page.title} · ${data.value.site.name}` : '',
    meta: data.value?.page.seoDescription ? [{ name: 'description', content: data.value.page.seoDescription }] : [],
    link: data.value ? [{ rel: 'stylesheet', href: themeFontsHref(data.value.site.theme) }] : []
}))

const themeVars = computed(() => siteThemeVars(data.value?.site.theme))
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

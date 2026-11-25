<script setup lang="ts">
// The frame around every public page of a client site: theme, fonts, header and footer.
const props = defineProps<{
    site: { name: string, theme: SiteTheme, integrations?: SiteIntegrations, socials?: SiteSocials, badge?: boolean }
    menus: { header: MenuItem[], footer: MenuItem[], legal: MenuItem[] }
}>()
useHead(() => ({ link: [{ rel: 'stylesheet', href: themeFontsHref(props.site.theme) }] }))
useHead(() => ({ link: props.site.theme?.favicon ? [{ rel: 'icon', href: props.site.theme.favicon }] : [] }))
const themeVars = computed(() => siteThemeVars(props.site.theme))
// Header over the page, or none: the first section starts at the very top (see .header-overlay in blocks.css)
const headerMode = computed(() => props.site.theme?.headerMode ?? 'normal')
const shellStyle = computed(() => ({ ...themeVars.value, '--site-header-h': props.site.theme?.headerStyle === 'centred' ? '104px' : '72px' }))
const integrations = computed(() => props.site.integrations ?? {})
provide('siteIntegrations', integrations)
provide('siteSocials', computed(() => props.site.socials ?? {}))
const tracking = ref<{ reopen: () => void } | null>(null)
const hasCookies = computed(() => !!(integrations.value.ga4 || integrations.value.metaPixel))
</script>

<template>
    <div class="site" :class="`header-${headerMode}`" :style="shellStyle">
        <SiteHeader v-if="headerMode !== 'hidden'" :name="site.name" :items="menus.header" :theme="site.theme" :socials="site.socials" />
        <main>
            <slot />
        </main>
        <SiteFooter :name="site.name" :items="menus.footer" :legal="menus.legal" :theme="site.theme" :socials="site.socials" :badge="site.badge" :cookie-settings="hasCookies" @cookie-settings="tracking?.reopen()" />
        <SiteTracking ref="tracking" :integrations="integrations" />
    </div>
</template>

<style scoped>
.site { background: var(--site-bg); color: var(--site-text); display: flex; flex-direction: column; font-family: var(--site-body-font); min-height: 100vh; }
main { flex: 1; }
</style>

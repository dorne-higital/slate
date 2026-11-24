<script setup lang="ts">
// The frame around every public page of a client site: theme, fonts, header and footer.
const props = defineProps<{
    site: { name: string, theme: SiteTheme }
    menus: { header: MenuItem[], footer: MenuItem[], legal: MenuItem[] }
}>()
useHead(() => ({ link: [{ rel: 'stylesheet', href: themeFontsHref(props.site.theme) }] }))
const themeVars = computed(() => siteThemeVars(props.site.theme))
</script>

<template>
    <div class="site" :style="themeVars">
        <SiteHeader :name="site.name" :items="menus.header" />
        <main>
            <slot />
        </main>
        <SiteFooter :name="site.name" :items="menus.footer" :legal="menus.legal" />
    </div>
</template>

<style scoped>
.site { background: var(--site-bg); color: var(--site-text); display: flex; flex-direction: column; font-family: var(--site-body-font); min-height: 100vh; }
main { flex: 1; }
</style>

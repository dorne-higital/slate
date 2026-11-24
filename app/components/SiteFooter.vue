<script setup lang="ts">
const props = defineProps<{ name: string, items: MenuItem[], legal: MenuItem[], preview?: boolean, cookieSettings?: boolean, theme?: SiteTheme | null, socials?: SiteSocials | null }>()
const t = computed(() => ({ ...DEFAULT_THEME, ...props.theme }))
// Columns style: top-level footer items are headings, their children the links underneath
const columns = computed(() => menuTree(props.items))
defineEmits<{ cookieSettings: [] }>()
const year = new Date().getFullYear()
</script>

<template>
    <footer class="sf" :class="`style-${t.footerStyle}`">
        <div class="sf-inner">
            <div class="sf-top">
                <div class="sf-brand">
                    <img v-if="t.logo" :src="t.logo" :alt="name" class="sf-logo">
                    <b v-else class="sf-name">{{ name }}</b>
                    <SocialIcons :socials="socials" :preview="preview" />
                </div>
                <nav v-if="items.length && t.footerStyle === 'columns'" aria-label="Footer" class="sf-cols">
                    <div v-for="col in columns" :key="col.id" class="sf-col">
                        <span v-if="preview || !col.url" class="sf-col-title">{{ col.label }}</span>
                        <a v-else :href="col.url" class="sf-col-title">{{ col.label }}</a>
                        <template v-for="child in col.children" :key="child.id">
                            <span v-if="preview">{{ child.label }}</span>
                            <a v-else :href="child.url" :target="child.newTab ? '_blank' : undefined" :rel="child.newTab ? 'noopener' : undefined">{{ child.label }}</a>
                        </template>
                    </div>
                </nav>
                <nav v-else-if="items.length" aria-label="Footer" class="sf-links">
                    <template v-for="item in items" :key="item.id">
                        <span v-if="preview">{{ item.label }}</span>
                        <a v-else :href="item.url" :target="item.newTab ? '_blank' : undefined" :rel="item.newTab ? 'noopener' : undefined">{{ item.label }}</a>
                    </template>
                </nav>
            </div>
            <div class="sf-bottom">
                <span>© {{ year }} {{ name }}</span>
                <nav v-if="legal.length || cookieSettings" aria-label="Legal" class="sf-legal">
                    <template v-for="item in legal" :key="item.id">
                        <span v-if="preview">{{ item.label }}</span>
                        <a v-else :href="item.url">{{ item.label }}</a>
                    </template>
                    <button v-if="cookieSettings && !preview" type="button" class="sf-cookie" @click="$emit('cookieSettings')">Cookie settings</button>
                </nav>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.sf { background: var(--site-footer-bg, var(--site-dark)); color: var(--site-footer-text, var(--site-on-dark)); font-family: var(--site-body-font); font-size: 15px; }
.sf-inner { display: flex; flex-direction: column; gap: 28px; margin: 0 auto; max-width: 1120px; padding: 48px 24px 32px; }
.sf-top { display: flex; flex-wrap: wrap; gap: 24px; justify-content: space-between; }
.sf-name { font-family: var(--site-heading-font); font-size: 20px; }
.sf-links { display: flex; flex-wrap: wrap; gap: 12px 28px; }
.sf a, .sf span { color: inherit; text-decoration: none; }
.sf a:hover { text-decoration: underline; }
.sf-bottom { border-top: 1px solid currentcolor; display: flex; flex-wrap: wrap; font-size: 13px; gap: 12px 24px; justify-content: space-between; opacity: .75; padding-top: 20px; }
.sf-legal { display: flex; flex-wrap: wrap; gap: 20px; }
.sf-cookie { background: none; border: 0; color: inherit; cursor: pointer; font: inherit; padding: 0; }
.sf-cookie:hover { text-decoration: underline; }
.sf-brand { display: flex; flex-direction: column; gap: 12px; }
.sf-logo { display: block; height: var(--site-logo-height, 36px); max-width: 220px; object-fit: contain; width: auto; }
.sf-cols { display: grid; flex: 1; gap: 24px 40px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); max-width: 720px; }
.sf-col { display: flex; flex-direction: column; gap: 10px; }
.sf-col-title { font-weight: 700; }
</style>

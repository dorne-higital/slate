<script setup lang="ts">
// A client site's header. `preview` turns links inert (used inside the editor, theme and layout previews).
// Style comes from the theme: standard (name left, links right), centred, or mega (wide dropdown panels).
const props = defineProps<{ name: string, items: MenuItem[], preview?: boolean, compact?: boolean, theme?: SiteTheme | null, socials?: SiteSocials | null }>()
const tree = computed(() => menuTree(props.items))
const open = ref(false)
const isInternal = (url: string) => url.startsWith('/')
const t = computed(() => ({ ...DEFAULT_THEME, ...props.theme }))
// On a dark or coloured header, use the light version of the logo if there is one
const logo = computed(() => (t.value.headerColour !== 'page' && t.value.headerColour !== 'soft' && t.value.logoOnDark) || t.value.logo)
</script>

<template>
    <header class="sh" :class="[`style-${t.headerStyle}`, { sticky: t.headerSticky && !preview, glass: t.headerGlass }]">
        <div class="sh-bar">
            <component :is="preview ? 'span' : resolveComponent('NuxtLink')" to="/" class="sh-name" :aria-label="logo ? name : undefined">
                <img v-if="logo" :src="logo" :alt="name" class="sh-logo">
                <template v-else>{{ name }}</template>
            </component>
            <button v-if="!preview" class="sh-toggle" type="button" :aria-expanded="open" aria-controls="site-menu" @click="open = !open">Menu</button>
            <nav v-if="!compact" id="site-menu" aria-label="Main" class="sh-nav" :class="{ open }">
                <div v-for="item in tree" :key="item.id" class="sh-item" :class="{ drop: item.children.length }">
                    <span v-if="preview" class="sh-link" :class="{ btn: item.button }">{{ item.label }}</span>
                    <NuxtLink v-else-if="isInternal(item.url)" :to="item.url" class="sh-link" :class="{ btn: item.button }" @click="open = false">{{ item.label }}</NuxtLink>
                    <a v-else :href="item.url" class="sh-link" :class="{ btn: item.button }" :target="item.newTab ? '_blank' : undefined" :rel="item.newTab ? 'noopener' : undefined">{{ item.label }}</a>
                    <div v-if="item.children.length" class="sh-sub">
                        <span v-if="t.headerStyle === 'mega'" class="sh-mega-title">{{ item.label }}</span>
                        <div class="sh-sub-links">
                            <template v-for="child in item.children" :key="child.id">
                                <span v-if="preview" class="sh-sublink">{{ child.label }}</span>
                                <NuxtLink v-else-if="isInternal(child.url)" :to="child.url" class="sh-sublink" @click="open = false">{{ child.label }}</NuxtLink>
                                <a v-else :href="child.url" class="sh-sublink" :target="child.newTab ? '_blank' : undefined">{{ child.label }}</a>
                            </template>
                        </div>
                    </div>
                </div>
                <SocialIcons v-if="t.headerSocials" :socials="socials" :preview="preview" :size="18" class="sh-soc" />
            </nav>
        </div>
    </header>
</template>

<style scoped>
.sh { background: var(--site-header-bg, var(--site-bg)); border-bottom: 1px solid rgb(0 0 0 / 8%); color: var(--site-header-text, var(--site-heading)); font-family: var(--site-body-font); position: relative; z-index: 20; }
.sh.sticky { position: sticky; top: 0; }
/* Frosted glass: the header colour at 70%, blurring what scrolls underneath. Solid where blur isn't supported. */
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .sh.glass { -webkit-backdrop-filter: saturate(170%) blur(16px); backdrop-filter: saturate(170%) blur(16px); background: color-mix(in srgb, var(--site-header-bg, var(--site-bg)) 70%, transparent); border-bottom-color: rgb(255 255 255 / 18%); box-shadow: 0 1px 0 rgb(0 0 0 / 6%); }
}
@media (prefers-reduced-transparency: reduce) { .sh.glass { background: var(--site-header-bg, var(--site-bg)); } }
.sh-bar { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; margin: 0 auto; max-width: 1120px; min-height: 72px; padding: 0 24px; }
.sh-name { align-items: center; color: inherit; display: inline-flex; font-family: var(--site-heading-font); font-size: 20px; font-weight: 800; text-decoration: none; }
.sh-logo { display: block; height: var(--site-logo-height, 36px); max-width: 240px; object-fit: contain; width: auto; }
.sh-nav { align-items: center; display: flex; flex-wrap: wrap; gap: 8px 24px; }
.sh-item { position: relative; }
.sh-link { color: inherit; cursor: pointer; display: inline-block; font-size: var(--site-nav-size, 15px); font-weight: 500; padding: 8px 0; text-decoration: none; text-transform: var(--site-nav-case, none); }
.sh-link:hover, .sh-link.router-link-exact-active { text-decoration: underline; text-decoration-color: var(--site-accent, currentcolor); text-decoration-thickness: 2px; text-underline-offset: 6px; }
.sh-link.btn { background: var(--site-primary); border-radius: var(--site-radius); color: var(--site-primary-text); font-weight: 700; padding: 9px 16px; text-decoration: none; text-transform: var(--site-button-case, none); }
.drop > .sh-link::after { content: ' ▾'; font-size: 11px; }
.sh-sub { background: var(--site-bg); border-radius: 8px; box-shadow: 0 8px 24px rgb(0 0 0 / 12%); color: var(--site-heading); display: none; flex-direction: column; left: -12px; min-width: 200px; padding: 8px; position: absolute; top: 100%; z-index: 10; }
.sh-sub-links { display: flex; flex-direction: column; }
.sh-item:hover .sh-sub, .sh-item:focus-within .sh-sub { display: flex; }
.sh-sublink { border-radius: 6px; color: var(--site-heading); font-size: 15px; padding: 8px 12px; text-decoration: none; }
.sh-sublink:hover { background: var(--site-surface); }
.sh-toggle { background: none; border: 1.5px solid currentcolor; border-radius: var(--site-radius); color: inherit; display: none; font: inherit; font-weight: 600; padding: 6px 12px; }
.sh-soc { margin-left: 4px; }

/* Centred: name on its own line, links centred underneath */
.style-centred .sh-bar { flex-direction: column; gap: 6px; justify-content: center; padding-bottom: 10px; padding-top: 16px; }
.style-centred .sh-nav { justify-content: center; }

/* Mega: dropdowns become a wide panel with the links in columns */
.style-mega .sh-bar { position: relative; }
.style-mega .sh-item { position: static; }
.style-mega .sh-sub { border-radius: 0 0 10px 10px; gap: 12px; left: 24px; padding: 24px 28px; right: 24px; }
.style-mega .sh-mega-title { color: var(--site-muted); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
.style-mega .sh-sub-links { display: grid; gap: 4px 24px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }

@media (max-width: 720px) {
    .sh-toggle { display: inline-block; }
    .style-centred .sh-bar { flex-direction: row; justify-content: space-between; padding: 0 24px; }
    .sh-nav { align-items: flex-start; display: none; flex-basis: 100%; flex-direction: column; padding-bottom: 16px; }
    .sh-nav.open { display: flex; }
    .sh-sub, .style-mega .sh-sub { background: transparent; box-shadow: none; color: inherit; display: flex; left: auto; padding: 0 0 0 12px; position: static; right: auto; }
    .style-mega .sh-sub-links { display: flex; }
    .sh-sublink { color: inherit; }
    .sh-mega-title { display: none; }
}
</style>

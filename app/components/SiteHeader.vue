<script setup lang="ts">
// A client site's header. `preview` turns links inert (used inside the editor and theme preview).
const props = defineProps<{ name: string, items: MenuItem[], preview?: boolean, compact?: boolean }>()
const tree = computed(() => menuTree(props.items))
const open = ref(false)
const isInternal = (url: string) => url.startsWith('/')
</script>

<template>
    <header class="sh">
        <div class="sh-bar">
            <component :is="preview ? 'span' : resolveComponent('NuxtLink')" to="/" class="sh-name">{{ name }}</component>
            <button v-if="!preview" class="sh-toggle" type="button" :aria-expanded="open" aria-controls="site-menu" @click="open = !open">Menu</button>
            <nav v-if="!compact" id="site-menu" aria-label="Main" class="sh-nav" :class="{ open }">
                <div v-for="item in tree" :key="item.id" class="sh-item" :class="{ drop: item.children.length }">
                    <span v-if="preview" class="sh-link" :class="{ btn: item.button }">{{ item.label }}</span>
                    <NuxtLink v-else-if="isInternal(item.url)" :to="item.url" class="sh-link" :class="{ btn: item.button }" @click="open = false">{{ item.label }}</NuxtLink>
                    <a v-else :href="item.url" class="sh-link" :class="{ btn: item.button }" :target="item.newTab ? '_blank' : undefined" :rel="item.newTab ? 'noopener' : undefined">{{ item.label }}</a>
                    <div v-if="item.children.length" class="sh-sub">
                        <template v-for="child in item.children" :key="child.id">
                            <span v-if="preview" class="sh-sublink">{{ child.label }}</span>
                            <NuxtLink v-else-if="isInternal(child.url)" :to="child.url" class="sh-sublink" @click="open = false">{{ child.label }}</NuxtLink>
                            <a v-else :href="child.url" class="sh-sublink" :target="child.newTab ? '_blank' : undefined">{{ child.label }}</a>
                        </template>
                    </div>
                </div>
            </nav>
        </div>
    </header>
</template>

<style scoped>
.sh { background: var(--site-bg); border-bottom: 1px solid rgb(0 0 0 / 8%); font-family: var(--site-body-font); }
.sh-bar { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; margin: 0 auto; max-width: 1120px; min-height: 72px; padding: 0 24px; }
.sh-name { color: var(--site-heading); font-family: var(--site-heading-font); font-size: 20px; font-weight: 800; text-decoration: none; }
.sh-nav { align-items: center; display: flex; flex-wrap: wrap; gap: 8px 24px; }
.sh-item { position: relative; }
.sh-link { color: var(--site-heading); cursor: pointer; display: inline-block; font-size: 15px; font-weight: 500; padding: 8px 0; text-decoration: none; }
.sh-link:hover, .sh-link.router-link-exact-active { text-decoration: underline; text-underline-offset: 6px; }
.sh-link.btn { background: var(--site-primary); border-radius: var(--site-radius); color: var(--site-primary-text); font-weight: 700; padding: 9px 16px; text-decoration: none; }
.drop > .sh-link::after { content: ' ▾'; font-size: 11px; }
.sh-sub { background: var(--site-bg); border-radius: 8px; box-shadow: 0 8px 24px rgb(0 0 0 / 12%); display: none; flex-direction: column; left: -12px; min-width: 200px; padding: 8px; position: absolute; top: 100%; z-index: 10; }
.sh-item:hover .sh-sub, .sh-item:focus-within .sh-sub { display: flex; }
.sh-sublink { border-radius: 6px; color: var(--site-heading); font-size: 15px; padding: 8px 12px; text-decoration: none; }
.sh-sublink:hover { background: var(--site-surface); }
.sh-toggle { background: none; border: 1.5px solid currentcolor; border-radius: var(--site-radius); color: var(--site-heading); display: none; font: inherit; font-weight: 600; padding: 6px 12px; }

@media (max-width: 720px) {
    .sh-toggle { display: inline-block; }
    .sh-nav { align-items: flex-start; display: none; flex-basis: 100%; flex-direction: column; padding-bottom: 16px; }
    .sh-nav.open { display: flex; }
    .sh-sub { box-shadow: none; display: flex; padding: 0 0 0 12px; position: static; }
}
</style>

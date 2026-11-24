<script setup lang="ts">
defineProps<{ name: string, items: MenuItem[], legal: MenuItem[], preview?: boolean, cookieSettings?: boolean }>()
defineEmits<{ cookieSettings: [] }>()
const year = new Date().getFullYear()
</script>

<template>
    <footer class="sf">
        <div class="sf-inner">
            <div class="sf-top">
                <b class="sf-name">{{ name }}</b>
                <nav v-if="items.length" aria-label="Footer" class="sf-links">
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
.sf { background: var(--site-dark); color: var(--site-on-dark); font-family: var(--site-body-font); font-size: 15px; }
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
</style>

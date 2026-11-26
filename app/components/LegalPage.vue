<script setup lang="ts">
// Shared frame for the privacy policy and terms on Slate's own site.
defineProps<{ title: string }>()
// Before launch the public sees these pages on their own, with no links to the unreleased marketing pages
const { comingSoon } = useRuntimeConfig().public
const { me } = useMe()
const plain = computed(() => !!comingSoon && !me.value?.isPlatformAdmin)
</script>

<template>
    <div class="legal">
        <header v-if="plain" class="top">
            <NuxtLink to="/" aria-label="Slate home" class="home"><BrandMark /></NuxtLink>
            <nav aria-label="Legal" class="links">
                <NuxtLink to="/privacy">Privacy</NuxtLink>
                <NuxtLink to="/terms">Terms</NuxtLink>
            </nav>
        </header>
        <div class="body">
            <h1>{{ title }}</h1>
            <p class="muted">Last updated {{ LEGAL.updated }}</p>
            <slot />
        </div>
    </div>
</template>

<style scoped>
.legal { background: var(--white); border-bottom: 1px solid var(--line-soft); }
.top { align-items: center; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; margin: 0 auto; max-width: 820px; padding: 18px 16px; }
.home { text-decoration: none; }
.links { display: flex; gap: 18px; }
.links a { color: var(--text-body); font-weight: 600; text-decoration: none; }
.links a.router-link-active { color: var(--quarry); text-decoration: underline; }
.body { margin: 0 auto; max-width: 820px; padding: 56px 16px 88px; }
h1 { font-size: 36px; font-weight: 800; letter-spacing: -.03em; margin: 0 0 6px; }
.body :deep(h2) { font-size: 21px; margin: 36px 0 10px; }
.body :deep(h3) { font-size: 17px; margin: 22px 0 8px; }
.body :deep(p), .body :deep(li) { line-height: 1.65; }
.body :deep(ul) { padding-left: 22px; }
.body :deep(table) { border-collapse: collapse; font-size: 15px; margin: 12px 0; width: 100%; }
.body :deep(th), .body :deep(td) { border-bottom: 1px solid var(--line-soft); padding: 8px 10px 8px 0; text-align: left; vertical-align: top; }
@media (max-width: 600px) { .body :deep(table) { font-size: 14px; } }
</style>

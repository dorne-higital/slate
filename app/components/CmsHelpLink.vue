<script setup lang="ts">
// "Help with this page": opens the help centre at the area that explains the current CMS screen.
// Shows nothing on screens no area covers.
const props = defineProps<{ screen?: string }>()
const route = useRoute()
const area = computed(() => helpAreaFor(props.screen ?? cmsScreen(route.path)))
</script>

<template>
    <a v-if="area" :href="`/help#${area}`" target="_blank" rel="noopener" class="help-link">
        <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13M7 7a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2M9 12.5v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        Help with this page<span class="visually-hidden"> (opens in a new tab)</span>
    </a>
</template>

<style scoped>
.help-link { align-items: center; color: var(--heather); display: inline-flex; font-size: 14px; font-weight: 600; gap: 6px; text-decoration: none; }
.help-link:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>

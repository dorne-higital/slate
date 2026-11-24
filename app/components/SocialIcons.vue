<script setup lang="ts">
// Links to a site's social profiles as small monochrome icons (they take the surrounding text colour).
const props = defineProps<{ socials: SiteSocials | null | undefined, preview?: boolean, size?: number }>()
const NAMES: Record<SocialNetwork, string> = { facebook: 'Facebook', instagram: 'Instagram', x: 'X', linkedin: 'LinkedIn', tiktok: 'TikTok', youtube: 'YouTube', pinterest: 'Pinterest', threads: 'Threads' }
const links = computed(() => SOCIAL_NETWORKS.filter(n => props.socials?.[n]).map(n => ({ key: n, name: NAMES[n], url: props.socials![n]! })))
</script>

<template>
    <ul v-if="links.length" class="soc" aria-label="Social media">
        <li v-for="l in links" :key="l.key">
            <component :is="preview ? 'span' : 'a'" :href="preview ? undefined : l.url" :target="preview ? undefined : '_blank'" rel="noopener me" class="soc-link" :aria-label="preview ? undefined : `${l.name} (opens in a new tab)`" :title="l.name">
                <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <template v-if="l.key === 'facebook'"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5c0-.3.2-.5.5-.5z" /></template>
                    <template v-else-if="l.key === 'instagram'"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" fill="currentColor" /></template>
                    <template v-else-if="l.key === 'x'"><path d="M4 4l16 16M20 4L4 20" /></template>
                    <template v-else-if="l.key === 'linkedin'"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" /><path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.3-2.6S16 11.3 16 13v3" /></template>
                    <template v-else-if="l.key === 'tiktok'"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.4 2 4 4.5 4.3" /></template>
                    <template v-else-if="l.key === 'youtube'"><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.3v5.4l4.6-2.7z" fill="currentColor" /></template>
                    <template v-else-if="l.key === 'pinterest'"><circle cx="12" cy="12" r="9" /><path d="M10.8 8.6c2.6-1 5.3.5 4.6 3.4-.5 2.2-2.6 2.8-3.6 1.6M11.6 10.5l-2.1 9" /></template>
                    <template v-else><path d="M16.5 11.2c-.4-3-2.4-4.7-5-4.5-2.8.2-4.4 2.6-4.3 5.6.1 3.4 2.2 5.4 5.1 5.4 2.7 0 4.6-1.7 4.6-4.1 0-2.6-2.3-3.7-4.6-3.4-1.7.2-2.6 1.3-2.4 2.5.2 1.3 1.7 1.8 2.8 1.4 1.4-.5 1.8-2.1 1.4-4.4" /></template>
                </svg>
            </component>
        </li>
    </ul>
</template>

<style scoped>
.soc { align-items: center; display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 0; padding: 0; }
.soc-link { align-items: center; border-radius: 50%; color: inherit; display: inline-flex; height: 36px; justify-content: center; opacity: .85; width: 36px; }
.soc-link:hover { background: color-mix(in srgb, currentcolor 12%, transparent); opacity: 1; }
</style>

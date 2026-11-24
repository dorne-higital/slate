<script setup lang="ts">
defineProps<{ heading?: string, intro?: string }>()
const integrations = inject<Ref<SiteIntegrations>>('siteIntegrations', ref({}))
const preview = inject<boolean>('blockPreview', false)
const src = computed(() => integrations.value.calendly ? `${integrations.value.calendly.replace(/\/$/, '')}?hide_gdpr_banner=1&embed_type=Inline` : '')
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <h2 v-if="heading">{{ heading }}</h2>
            <p v-if="intro" class="blk-muted">{{ intro }}</p>
            <div v-if="preview" class="placeholder">
                {{ integrations.calendly ? `Your Calendly calendar (${integrations.calendly.replace('https://', '')}) shows here.` : 'Connect Calendly in Integrations to show your booking calendar here.' }}
            </div>
            <iframe v-else-if="src" :src="src" :title="heading || 'Book a time'" loading="lazy" class="cal" />
        </div>
    </section>
</template>

<style scoped>
.cal { border: 0; border-radius: var(--site-card-radius); height: 700px; width: 100%; }
.placeholder { background: var(--site-surface); border: 2px dashed color-mix(in srgb, var(--site-text) 25%, transparent); border-radius: 8px; color: var(--site-muted); padding: 48px 24px; text-align: center; }
</style>

<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, layout?: string, items?: { label?: string, value?: string, url?: string }[] }>()
const layout = computed(() => choice('details', 'layout', props.layout))
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <dl :class="`d-${layout}`">
                <div v-for="(d, i) in items" :key="i" class="row">
                    <dt>{{ d.label }}</dt>
                    <dd><a v-if="d.url" :href="d.url">{{ d.value }}</a><template v-else>{{ d.value }}</template></dd>
                </div>
            </dl>
        </div>
    </section>
</template>

<style scoped>
dl { margin: 0; }
.d-row { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.d-list { display: flex; flex-direction: column; max-width: 640px; }
.d-list .row { border-bottom: 1px solid color-mix(in srgb, currentcolor 12%, transparent); display: flex; gap: 16px; justify-content: space-between; padding: 14px 0; }
dt { color: var(--site-muted); font-size: 14px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
dd { color: var(--site-heading); font-size: 18px; font-weight: 700; margin: 4px 0 0; }
dd a { color: inherit; }
</style>

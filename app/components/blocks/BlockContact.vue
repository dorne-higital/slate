<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, email?: string, phone?: string, address?: string, hours?: string, map?: string }>()
const lines = (s?: string) => (s ?? '').split('\n').map(l => l.trim()).filter(Boolean)
// OpenStreetMap: no API key, no tracking cookies. Search link + embedded map of the area.
const mapUrl = computed(() => props.address && choice('contact', 'map', props.map) === 'show'
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(lines(props.address).join(', '))}`
    : '')
const tel = computed(() => (props.phone ?? '').replace(/[^\d+]/g, ''))
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <div class="grid">
                <dl class="info">
                    <div v-if="email"><dt>Email</dt><dd><a :href="`mailto:${email}`">{{ email }}</a></dd></div>
                    <div v-if="phone"><dt>Phone</dt><dd><a :href="`tel:${tel}`">{{ phone }}</a></dd></div>
                    <div v-if="address"><dt>Address</dt><dd><span v-for="(l, i) in lines(address)" :key="i" class="line">{{ l }}</span></dd></div>
                    <div v-if="hours"><dt>Opening hours</dt><dd><span v-for="(l, i) in lines(hours)" :key="i" class="line">{{ l }}</span></dd></div>
                </dl>
                <a v-if="mapUrl" :href="mapUrl" target="_blank" rel="noopener" class="map">
                    <span class="pin" aria-hidden="true">📍</span>
                    <b>See us on a map</b>
                    <span class="blk-muted">{{ lines(address).join(', ') }}</span>
                </a>
            </div>
        </div>
    </section>
</template>

<style scoped>
.grid { display: grid; gap: 40px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.info { display: flex; flex-direction: column; gap: 20px; margin: 0; }
dt { color: var(--site-muted); font-size: 14px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
dd { color: var(--site-heading); font-size: 18px; margin: 4px 0 0; }
dd a { color: inherit; }
.line { display: block; }
.map { align-items: center; background: var(--site-surface); border-radius: var(--site-card-radius); color: var(--site-heading); display: flex; flex-direction: column; gap: 8px; justify-content: center; min-height: 220px; padding: 24px; text-align: center; text-decoration: none; }
.pin { font-size: 40px; }
@media (max-width: 760px) { .grid { grid-template-columns: minmax(0, 1fr); } }
</style>

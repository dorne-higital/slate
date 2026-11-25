<script setup lang="ts">
type Row = { label?: string, title?: string, text?: string, ticks?: string, imageUrl?: string, imageAlt?: string, buttonLabel?: string, buttonUrl?: string }
const props = defineProps<{ frame?: string, firstSide?: string, items?: Row[] }>()
const frame = computed(() => choice('featureRows', 'frame', props.frame))
const leftFirst = computed(() => choice('featureRows', 'firstSide', props.firstSide) === 'left')
const rows = computed(() => (props.items ?? []).map((r, i) => ({
    ...r,
    paras: (r.text ?? '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean),
    tickList: (r.ticks ?? '').split('\n').map(t => t.trim()).filter(Boolean),
    flip: (i % 2 === 1) === leftFirst.value
})))
</script>

<template>
    <section class="blk features" :class="`f-${frame}`">
        <div class="blk-inner rows">
            <div v-for="(r, i) in rows" :key="i" class="row" :class="{ flip: r.flip }">
                <div class="pic">
                    <div class="frame"><ShowcaseFrame :kind="frame" :src="r.imageUrl" :alt="r.imageAlt" /></div>
                </div>
                <div class="words">
                    <p v-if="r.label" class="blk-eyebrow">{{ r.label }}</p>
                    <h2 v-if="r.title">{{ r.title }}</h2>
                    <p v-for="(p, j) in r.paras" :key="j" class="blk-muted">{{ p }}</p>
                    <ul v-if="r.tickList.length" class="ticks">
                        <li v-for="(t, j) in r.tickList" :key="j"><span class="tick" aria-hidden="true">✓</span>{{ t }}</li>
                    </ul>
                    <div v-if="r.buttonLabel" class="blk-btns"><a class="blk-btn" :href="r.buttonUrl || '#'">{{ r.buttonLabel }}</a></div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rows { gap: 72px; }
.row { align-items: center; display: grid; gap: 64px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.row.flip .pic { order: 2; }
.pic { align-items: center; background: var(--site-surface); border-radius: calc(var(--site-card-radius, 16px) + 8px); display: flex; justify-content: center; padding: 40px; }
.f-phone .frame { max-width: 230px; width: 100%; }
.f-browser .frame, .f-photo .frame, .f-plain .frame { width: 100%; }
.f-plain .pic, .f-photo .pic { background: none; padding: 0; }
.words { display: flex; flex-direction: column; gap: 16px; }
.ticks { display: flex; flex-direction: column; gap: 12px; list-style: none; margin: 4px 0 0; padding: 0; }
.ticks li { align-items: flex-start; display: flex; font-size: 17px; gap: 12px; }
.tick { align-items: center; background: color-mix(in srgb, var(--site-primary) 15%, transparent); border-radius: 50%; color: var(--site-primary); display: inline-flex; flex: none; font-size: 12px; font-weight: 800; height: 24px; justify-content: center; width: 24px; }
@media (max-width: 800px) {
    .rows { gap: 56px; }
    .row { gap: 28px; grid-template-columns: minmax(0, 1fr); }
    .row.flip .pic { order: 0; }
    .pic { padding: 28px; }
}
</style>

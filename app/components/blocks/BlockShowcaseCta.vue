<script setup lang="ts">
const props = defineProps<{
    eyebrow?: string, heading?: string, text?: string,
    buttonStyle?: string, buttonLabel?: string, buttonUrl?: string, button2Label?: string, button2Url?: string, qr?: string,
    frame?: string, imageUrl?: string, imageAlt?: string
}>()
const frame = computed(() => choice('showcaseCta', 'frame', props.frame))
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <div class="cta-panel" :class="[`f-${frame}`, { 'has-pic': imageUrl }]">
                <div class="words">
                    <p v-if="eyebrow" class="blk-eyebrow">{{ eyebrow }}</p>
                    <h2>{{ heading }}</h2>
                    <p v-if="text" class="lead">{{ text }}</p>
                    <ShowcaseButtons
                        :kind="buttonStyle" :button-label="buttonLabel" :button-url="buttonUrl" :button2-label="button2Label" :button2-url="button2Url"
                        :qr="qr" inverse
                    />
                </div>
                <div v-if="imageUrl" class="pic"><ShowcaseFrame :kind="frame" :src="imageUrl" :alt="imageAlt" /></div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.cta-panel { align-items: center; background: var(--site-primary); border-radius: calc(var(--site-card-radius, 16px) + 12px); color: var(--site-primary-text); display: grid; gap: 40px; grid-template-columns: minmax(0, 1fr); overflow: hidden; padding: 56px 64px; }
.cta-panel.has-pic { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); padding-bottom: 0; }
.words { display: flex; flex-direction: column; gap: 18px; padding-bottom: 0; }
.has-pic .words { padding-bottom: 56px; }
.cta-panel h2, .cta-panel .lead, .cta-panel .blk-eyebrow { color: var(--site-primary-text); }
.lead { font-size: 18px; }
.pic { align-self: end; display: flex; justify-content: center; margin-bottom: -70px; }
.f-phone .pic :deep(.sf) { max-width: 230px; }
.f-browser .pic, .f-photo .pic, .f-plain .pic { margin-bottom: -30px; }
@media (max-width: 800px) {
    .cta-panel, .cta-panel.has-pic { gap: 28px; grid-template-columns: minmax(0, 1fr); padding: 36px 24px 0; }
    .words, .has-pic .words { padding-bottom: 36px; }
    .pic { margin-bottom: -60px; }
}
</style>

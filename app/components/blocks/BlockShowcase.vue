<script setup lang="ts">
const props = defineProps<{
    layout?: string, height?: string, frame?: string, logoUrl?: string, eyebrow?: string, heading?: string, text?: string,
    buttonStyle?: string, buttonLabel?: string, buttonUrl?: string, button2Label?: string, button2Url?: string, qr?: string,
    rating?: string, ratingText?: string, imageUrl?: string, imageAlt?: string, image2Url?: string, image3Url?: string
}>()
const layout = computed(() => choice('showcase', 'layout', props.layout))
const frame = computed(() => choice('showcase', 'frame', props.frame))
const fill = computed(() => choice('showcase', 'height', props.height) === 'screen')
const phone = computed(() => frame.value === 'phone')
const stars = computed(() => {
    const n = Number.parseFloat(props.rating ?? '')
    return Number.isFinite(n) && n > 0 && n <= 5 ? n : null
})
</script>

<template>
    <section class="blk showcase" :class="[`l-${layout}`, phone ? 'is-phone' : 'is-wide', { 'h-screen': fill }]">
        <div class="blk-inner grid">
            <div class="words">
                <div v-if="logoUrl || eyebrow" class="top">
                    <img v-if="logoUrl" :src="logoUrl" alt="" class="logo">
                    <p v-if="eyebrow" class="blk-eyebrow">{{ eyebrow }}</p>
                </div>
                <h1>{{ heading }}</h1>
                <p v-if="text" class="blk-muted lead">{{ text }}</p>
                <ShowcaseButtons
                    :kind="buttonStyle" :button-label="buttonLabel" :button-url="buttonUrl" :button2-label="button2Label" :button2-url="button2Url"
                    :qr="qr" :align="layout === 'centred' ? 'center' : 'start'" :inverse="layout === 'band'"
                />
                <p v-if="stars" class="rating">
                    <span class="stars" :aria-label="`Rated ${stars} out of 5`">{{ '★'.repeat(Math.round(stars)) }}{{ '☆'.repeat(5 - Math.round(stars)) }}</span>
                    <b>{{ rating }}</b> <span v-if="ratingText">{{ ratingText }}</span>
                </p>
            </div>

            <div class="art">
                <template v-if="layout === 'centred' && phone">
                    <div v-if="image2Url" class="side"><ShowcaseFrame kind="phone" :src="image2Url" /></div>
                    <div class="main"><ShowcaseFrame kind="phone" :src="imageUrl" :alt="imageAlt" eager /></div>
                    <div v-if="image3Url" class="side"><ShowcaseFrame kind="phone" :src="image3Url" /></div>
                </template>
                <template v-else-if="layout === 'band' && phone">
                    <div v-if="image2Url" class="back"><ShowcaseFrame kind="phone" :src="image2Url" /></div>
                    <div class="front"><ShowcaseFrame kind="phone" :src="imageUrl" :alt="imageAlt" eager /></div>
                </template>
                <div v-else class="main">
                    <span v-if="layout === 'split'" class="glow" aria-hidden="true" />
                    <ShowcaseFrame :kind="frame" :src="imageUrl" :alt="imageAlt" eager />
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.showcase { overflow: hidden; padding: calc(var(--blk-pad, 72px) + 24px) 0 calc(var(--blk-pad, 72px) + 16px); }
.h-screen .grid { width: 100%; }
.grid { align-items: center; display: grid; gap: 56px; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
.words { display: flex; flex-direction: column; gap: 22px; }
.top { align-items: center; display: flex; gap: 12px; }
.top .blk-eyebrow { margin: 0; }
.logo { border-radius: 22%; height: 52px; object-fit: cover; width: 52px; }
h1 { color: var(--site-heading); font-family: var(--site-heading-font); font-size: var(--site-h1-size, clamp(38px, 5.6vw, 62px)); font-weight: 800; letter-spacing: -.035em; line-height: 1.03; margin: 0; max-width: 15em; text-transform: var(--site-heading-case, none); }
.lead { font-size: 19px; max-width: 34em; }
.rating { align-items: center; display: flex; flex-wrap: wrap; font-size: 15px; gap: 8px; }
.stars { color: #b7791f; letter-spacing: 2px; }

.art { align-items: center; display: flex; justify-content: center; position: relative; }
.main { position: relative; width: 100%; }
.is-phone .main { max-width: 300px; }
.glow { aspect-ratio: 1; background: var(--site-primary); border-radius: 50%; left: 50%; opacity: .13; position: absolute; top: 50%; transform: translate(-50%, -50%); width: 150%; }
.is-phone .glow { width: 150%; }
.is-wide .glow { width: 90%; }

/* Centred: words on top, pictures below */
.l-centred .grid { grid-template-columns: minmax(0, 1fr); }
.l-centred .words { align-items: center; text-align: center; }
.l-centred h1, .l-centred .lead { margin-left: auto; margin-right: auto; }
.l-centred .rating { justify-content: center; }
.l-centred.is-wide .main { max-width: 900px; }
.l-centred.is-phone .art { align-items: flex-start; gap: 28px; }
.l-centred.is-phone .main { max-width: 270px; }
.l-centred .side { margin-top: 56px; max-width: 220px; opacity: .92; width: 100%; }

/* Band: the theme's main colour, tilted pictures */
.l-band { background: var(--site-primary); color: var(--site-primary-text); }
.l-band h1, .l-band .lead, .l-band .blk-eyebrow, .l-band .rating { color: var(--site-primary-text); }
.l-band .grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.l-band .art { order: -1; min-height: 420px; }
.l-band .front { max-width: 270px; position: relative; transform: rotate(4deg) translateX(40px); width: 100%; z-index: 1; }
.l-band .back { left: 8%; max-width: 240px; opacity: .85; position: absolute; top: 6%; transform: rotate(-8deg); width: 60%; }
.l-band.is-wide .main { transform: rotate(-3deg); }
.l-band .stars { color: inherit; }

@media (max-width: 860px) {
    .grid, .l-band .grid { gap: 40px; grid-template-columns: minmax(0, 1fr); }
    .l-band .art { min-height: 0; order: 1; }
    .l-band .front { transform: none; }
    .l-band .back, .l-centred .side { display: none; }
    .is-phone .main, .l-band .front { max-width: 240px; }
}
</style>

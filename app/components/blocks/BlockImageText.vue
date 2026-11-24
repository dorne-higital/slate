<script setup lang="ts">
const props = defineProps<{ imageSide?: string, imageStyle?: string, eyebrow?: string, heading?: string, body?: string, ticks?: string, buttonLabel?: string, buttonUrl?: string, imageUrl?: string, imageAlt?: string }>()
const paras = computed(() => paragraphs(props.body))
const ticks = computed(() => (props.ticks ?? '').split('\n').map(t => t.trim()).filter(Boolean))
const side = computed(() => choice('imageText', 'imageSide', props.imageSide))
const style = computed(() => choice('imageText', 'imageStyle', props.imageStyle))
</script>

<template>
    <section class="blk">
        <div class="blk-inner split" :class="`img-${side}`">
            <div class="pic-wrap" :class="`s-${style}`">
                <img v-if="imageUrl" :src="imageUrl" :alt="imageAlt || ''" class="pic" loading="lazy">
                <div v-else class="pic placeholder" aria-hidden="true">Image</div>
            </div>
            <div class="words">
                <BlockHeading :eyebrow="eyebrow" :heading="heading" />
                <p v-for="(p, i) in paras" :key="i">{{ p }}</p>
                <ul v-if="ticks.length" class="ticks">
                    <li v-for="(t, i) in ticks" :key="i"><span class="tick" aria-hidden="true">✓</span>{{ t }}</li>
                </ul>
                <a v-if="buttonLabel" class="blk-btn" :href="buttonUrl || '#'">{{ buttonLabel }}</a>
            </div>
        </div>
    </section>
</template>

<style scoped>
.split { align-items: center; display: grid; gap: 56px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.img-right .pic-wrap { order: 2; }
.pic { aspect-ratio: 4 / 3; border-radius: var(--site-card-radius); display: block; object-fit: cover; width: 100%; }
.s-card { background: var(--site-bg); border-radius: calc(var(--site-card-radius) + 8px); box-shadow: 0 16px 40px rgb(0 0 0 / 12%); padding: 16px; }
.s-tilted { perspective: 1400px; }
.s-tilted .pic { box-shadow: 0 30px 60px rgb(0 0 0 / 18%); object-fit: cover; object-position: top; transform: rotateY(-12deg) rotateX(4deg); }
.img-right .s-tilted .pic { transform: rotateY(12deg) rotateX(4deg); }
.s-round .pic { aspect-ratio: 1; border-radius: 50%; margin: 0 auto; max-width: 420px; }
.placeholder { align-items: center; background: var(--site-surface); color: var(--site-muted); display: flex; font-size: 14px; justify-content: center; }
.words { align-items: flex-start; display: flex; flex-direction: column; gap: 18px; }
.ticks { display: flex; flex-direction: column; gap: 12px; list-style: none; margin: 4px 0 0; padding: 0; }
.ticks li { align-items: flex-start; display: flex; gap: 12px; font-size: 17px; }
.tick { align-items: center; background: color-mix(in srgb, var(--site-primary) 15%, transparent); border-radius: 50%; color: var(--site-primary); display: inline-flex; flex: none; font-size: 12px; font-weight: 800; height: 24px; justify-content: center; width: 24px; }
@media (max-width: 760px) { .split { gap: 28px; grid-template-columns: minmax(0, 1fr); } .img-right .pic-wrap { order: 0; } }
@media (prefers-reduced-motion: reduce) { .s-tilted .pic { transform: none !important; } }
</style>

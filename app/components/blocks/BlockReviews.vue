<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, layout?: string, items?: { quote?: string, name?: string, role?: string, photo?: string }[] }>()
const layout = computed(() => choice('reviews', 'layout', props.layout))
const list = computed(() => props.items ?? [])
const at = ref(0)
const current = computed(() => list.value[Math.min(at.value, list.value.length - 1)])
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <div v-if="layout === 'feature' && current" class="feature">
                <span class="mark" aria-hidden="true">“</span>
                <blockquote>
                    <p v-for="(p, j) in paragraphs(current.quote)" :key="j">{{ p }}</p>
                </blockquote>
                <figcaption class="who">
                    <img v-if="current.photo" :src="current.photo" alt="" class="photo">
                    <span><b>{{ current.name }}</b><span v-if="current.role" class="blk-muted">{{ current.role }}</span></span>
                </figcaption>
                <div v-if="list.length > 1" class="dots" role="group" aria-label="Choose a review">
                    <button v-for="(r, i) in list" :key="i" type="button" :class="{ on: i === at }" :aria-label="`Review ${i + 1} of ${list.length}`" :aria-pressed="i === at" @click="at = i" />
                </div>
            </div>
            <div v-else class="grid" :class="{ stack: layout === 'stack' }">
                <figure v-for="(item, i) in list" :key="i" class="card">
                    <blockquote>
                        <p v-for="(p, j) in paragraphs(item.quote)" :key="j">“{{ p }}”</p>
                    </blockquote>
                    <figcaption class="who">
                        <img v-if="item.photo" :src="item.photo" alt="" class="photo">
                        <span><b>{{ item.name }}</b><span v-if="item.role" class="blk-muted">{{ item.role }}</span></span>
                    </figcaption>
                </figure>
            </div>
        </div>
    </section>
</template>

<style scoped>
.grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.grid.stack { grid-template-columns: minmax(0, 1fr); max-width: 820px; }
.card { background: var(--site-surface); border-radius: var(--site-card-radius); display: flex; flex-direction: column; gap: 16px; margin: 0; padding: 28px; }
blockquote { margin: 0; }
blockquote p { font-family: var(--site-heading-font); font-size: 20px; line-height: 1.45; margin: 0 0 10px; max-width: none; }
.who { align-items: center; display: flex; gap: 12px; }
.who > span { display: flex; flex-direction: column; font-size: 15px; }
.photo { border-radius: 50%; height: 48px; object-fit: cover; width: 48px; }
.feature { background: var(--site-surface); border-radius: calc(var(--site-card-radius) * 2); display: flex; flex-direction: column; gap: 20px; margin: 0 auto; max-width: 900px; padding: 48px; position: relative; }
.feature blockquote p { color: var(--site-heading); font-size: clamp(20px, 2.4vw, 28px); font-weight: 600; }
.mark { color: var(--site-primary); font-family: Georgia, serif; font-size: 72px; height: 40px; line-height: 1; }
.dots { display: flex; gap: 8px; }
.dots button { background: currentcolor; border: 0; border-radius: 999px; cursor: pointer; height: 8px; opacity: .25; padding: 0; width: 8px; }
.dots button.on { opacity: 1; width: 24px; }
@media (max-width: 600px) { .feature { padding: 28px; } }
</style>

<script setup lang="ts">
defineProps<{ eyebrow?: string, heading?: string, before?: string, after?: string, beforeLabel?: string, afterLabel?: string }>()
const pos = ref(50)
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <div v-if="before && after" class="ba" :style="{ '--pos': `${pos}%` }">
                <img :src="after" :alt="afterLabel || 'After'" class="img">
                <img :src="before" :alt="beforeLabel || 'Before'" class="img top">
                <span class="tag l">{{ beforeLabel }}</span>
                <span class="tag r">{{ afterLabel }}</span>
                <span class="line" aria-hidden="true" />
                <label class="visually-hidden" :for="`ba-${before.length}`">Compare before and after</label>
                <input :id="`ba-${before.length}`" v-model.number="pos" type="range" min="0" max="100" class="range">
            </div>
            <div v-else class="empty">Choose a before and an after picture.</div>
        </div>
    </section>
</template>

<style scoped>
.ba { border-radius: var(--site-card-radius); overflow: hidden; position: relative; user-select: none; }
.img { display: block; height: auto; width: 100%; }
.top { clip-path: inset(0 calc(100% - var(--pos)) 0 0); inset: 0; height: 100%; object-fit: cover; position: absolute; }
.line { background: #fff; bottom: 0; box-shadow: 0 0 0 1px rgb(0 0 0 / 20%); left: var(--pos); position: absolute; top: 0; width: 3px; }
.range { cursor: ew-resize; height: 100%; inset: 0; margin: 0; opacity: 0; position: absolute; width: 100%; }
.tag { background: rgb(0 0 0 / 55%); border-radius: 999px; bottom: 14px; color: #fff; font-size: 13px; font-weight: 700; padding: 4px 10px; position: absolute; }
.tag.l { left: 14px; }
.tag.r { right: 14px; }
.empty { background: var(--site-surface); border-radius: 8px; color: var(--site-muted); padding: 40px; text-align: center; }
</style>

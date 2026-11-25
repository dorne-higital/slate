<script setup lang="ts">
const props = defineProps<{ style?: string, eyebrow?: string, heading?: string, text?: string, buttonLabel?: string, buttonUrl?: string }>()
const look = computed(() => choice('cta', 'style', props.style))
</script>

<template>
    <section class="blk" :class="`c-${look}`">
        <div class="blk-inner">
            <div class="box">
                <p v-if="eyebrow" class="blk-eyebrow">{{ eyebrow }}</p>
                <h2>{{ heading }}</h2>
                <p v-if="text" class="text">{{ text }}</p>
                <a v-if="buttonLabel" class="blk-btn" :href="buttonUrl || '#'">{{ buttonLabel }}</a>
            </div>
        </div>
    </section>
</template>

<style scoped>
.box { align-items: center; display: flex; flex-direction: column; gap: 18px; text-align: center; }
.text { max-width: 36em; opacity: .9; }
.box .blk-btn { align-self: center; }
.c-band { background: var(--site-dark); color: var(--site-on-dark); }
.c-band h2, .c-band .blk-eyebrow { color: var(--site-on-dark); }
.c-card .box { background: var(--site-surface); border-radius: calc(var(--site-card-radius) * 2); padding: 56px 32px; }
</style>

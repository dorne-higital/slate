<script setup lang="ts">
const props = defineProps<{ size?: string, speed?: string, items?: { text?: string }[] }>()
const words = computed(() => (props.items ?? []).map(i => i.text).filter(Boolean) as string[])
const seconds = computed(() => ({ slow: 60, normal: 36, fast: 20 })[choice('marquee', 'speed', props.speed) as 'slow' | 'normal' | 'fast'])
</script>

<template>
    <section class="blk mq" :class="`m-${choice('marquee', 'size', size)}`" :aria-label="words.join(', ')">
        <div class="track" :style="{ '--secs': `${seconds}s` }" aria-hidden="true">
            <span v-for="n in 2" :key="n" class="run">
                <span v-for="(w, i) in words" :key="i" class="w">{{ w }}<i class="dot" /></span>
            </span>
        </div>
    </section>
</template>

<style scoped>
.mq { overflow: hidden; padding: calc(var(--blk-pad, 72px) / 2) 0; }
.track { display: flex; width: max-content; animation: slide var(--secs) linear infinite; }
.run { display: flex; flex: none; }
.w { align-items: center; color: var(--site-heading); display: inline-flex; font-family: var(--site-heading-font); font-weight: 800; gap: 32px; padding-right: 32px; text-transform: var(--site-heading-case, none); white-space: nowrap; }
.m-large .w { font-size: clamp(40px, 7vw, 88px); }
.m-small .w { font-size: 22px; }
.dot { background: var(--site-primary); border-radius: 50%; display: inline-block; height: .25em; width: .25em; }
@keyframes slide { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .track { animation: none; flex-wrap: wrap; width: auto; } .run + .run { display: none; } }
</style>

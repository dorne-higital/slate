<script setup lang="ts">
// Label + heading + intro, shared by every block so they all look alike.
const props = defineProps<{ eyebrow?: string, heading?: string, intro?: string, tag?: 'h1' | 'h2', centre?: boolean }>()
const paras = computed(() => paragraphs(props.intro))
</script>

<template>
    <div v-if="eyebrow || heading || intro" class="blk-head" :class="{ centre }">
        <p v-if="eyebrow" class="blk-eyebrow">{{ eyebrow }}</p>
        <component :is="tag ?? 'h2'" v-if="heading">{{ heading }}</component>
        <p v-for="(p, i) in paras" :key="i" class="blk-muted">{{ p }}</p>
    </div>
</template>

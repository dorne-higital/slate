<script setup lang="ts">
const props = defineProps<{ align?: string, eyebrow?: string, heading?: string, body?: string }>()
const paras = computed(() => paragraphs(props.body))
const centre = computed(() => choice('text', 'align', props.align) === 'centre')
</script>

<template>
    <section class="blk">
        <div class="blk-inner narrow" :class="{ centre }">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" :centre="centre" />
            <p v-for="(p, i) in paras" :key="i">{{ p }}</p>
        </div>
    </section>
</template>

<style scoped>
.narrow { max-width: 820px; }
.centre { align-items: center; text-align: center; }
p { white-space: pre-line; }
</style>

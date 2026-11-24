<script setup lang="ts">
const props = defineProps<{ heading?: string, body?: string }>()
const paras = computed(() => paragraphs(props.body))
</script>

<template>
    <section class="blk">
        <div class="blk-inner narrow">
            <h2 v-if="heading">{{ heading }}</h2>
            <p v-for="(p, i) in paras" :key="i">{{ p }}</p>
        </div>
    </section>
</template>

<style scoped>
.narrow { max-width: 820px; }
p { white-space: pre-line; }
</style>

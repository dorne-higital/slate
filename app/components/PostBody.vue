<script setup lang="ts">
const props = defineProps<{ body: string }>()
const parts = computed(() => parsePostBody(props.body))
</script>

<template>
    <div class="post-body">
        <template v-for="(part, i) in parts" :key="i">
            <h2 v-if="part.kind === 'h'">{{ part.text }}</h2>
            <ul v-else-if="part.kind === 'ul'"><li v-for="(item, j) in part.items" :key="j">{{ item }}</li></ul>
            <p v-else>{{ part.text }}</p>
        </template>
    </div>
</template>

<style scoped>
.post-body { display: flex; flex-direction: column; font-size: 18px; gap: 20px; line-height: 1.7; }
.post-body h2 { color: var(--site-heading); font-family: var(--site-heading-font); font-size: 26px; line-height: 1.2; margin: 16px 0 0; }
.post-body p { margin: 0; white-space: pre-line; }
.post-body ul { display: flex; flex-direction: column; gap: 8px; margin: 0; padding-left: 24px; }
</style>

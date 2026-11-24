<script setup lang="ts">
defineProps<{ heading?: string, items?: { question?: string, answer?: string }[] }>()
</script>

<template>
    <section class="blk">
        <div class="blk-inner narrow">
            <h2 v-if="heading">{{ heading }}</h2>
            <div class="list">
                <details v-for="(item, i) in items" :key="i">
                    <summary>{{ item.question }}</summary>
                    <p v-for="(p, j) in paragraphs(item.answer)" :key="j" class="blk-muted">{{ p }}</p>
                </details>
            </div>
        </div>
    </section>
</template>

<style scoped>
.narrow { max-width: 820px; }
.list { border-top: 1px solid rgb(0 0 0 / 12%); }
details { border-bottom: 1px solid rgb(0 0 0 / 12%); padding: 18px 0; }
summary { cursor: pointer; font-size: 18px; font-weight: 700; }
details p { margin-top: 12px; }
</style>

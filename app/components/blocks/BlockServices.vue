<script setup lang="ts">
defineProps<{ heading?: string, intro?: string, items?: { title?: string, text?: string }[] }>()
</script>

<template>
    <section class="blk blk-alt">
        <div class="blk-inner">
            <h2 v-if="heading">{{ heading }}</h2>
            <p v-if="intro" class="blk-muted">{{ intro }}</p>
            <ul class="grid">
                <li v-for="(item, i) in items" :key="i" class="card">
                    <b>{{ item.title }}</b>
                    <span>{{ item.text }}</span>
                </li>
            </ul>
        </div>
    </section>
</template>

<style scoped>
.grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); list-style: none; margin: 8px 0 0; padding: 0; }
.card { background: var(--site-bg); border-radius: var(--site-card-radius); display: flex; flex-direction: column; gap: 8px; padding: 24px; }
.card b { font-size: 19px; }
.card span { color: var(--site-muted); line-height: 1.55; }
</style>

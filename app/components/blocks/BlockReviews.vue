<script setup lang="ts">
defineProps<{ heading?: string, items?: { quote?: string, name?: string }[] }>()
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <h2 v-if="heading">{{ heading }}</h2>
            <div class="grid">
                <figure v-for="(item, i) in items" :key="i">
                    <blockquote>“{{ item.quote }}”</blockquote>
                    <figcaption v-if="item.name">{{ item.name }}</figcaption>
                </figure>
            </div>
        </div>
    </section>
</template>

<style scoped>
.grid { display: grid; gap: 32px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
figure { border-left: 0; display: flex; flex-direction: column; gap: 14px; margin: 0; }
blockquote { font-family: var(--site-heading-font); font-size: 22px; line-height: 1.45; margin: 0; }
figcaption { color: var(--site-muted); font-size: 15px; font-weight: 600; }
</style>

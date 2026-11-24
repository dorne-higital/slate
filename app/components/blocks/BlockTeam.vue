<script setup lang="ts">
defineProps<{ eyebrow?: string, heading?: string, intro?: string, items?: { photo?: string, name?: string, role?: string, bio?: string }[] }>()
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" :intro="intro" />
            <ul class="team">
                <li v-for="(t, i) in items" :key="i">
                    <img v-if="t.photo" :src="t.photo" :alt="t.name ? `${t.name}` : ''" class="ph" loading="lazy">
                    <span v-else class="ph empty" aria-hidden="true">{{ t.name?.[0] }}</span>
                    <b>{{ t.name }}</b>
                    <span class="role">{{ t.role }}</span>
                    <p v-if="t.bio" class="blk-muted">{{ t.bio }}</p>
                </li>
            </ul>
        </div>
    </section>
</template>

<style scoped>
.team { display: grid; gap: 32px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); list-style: none; margin: 0; padding: 0; }
li { display: flex; flex-direction: column; gap: 6px; }
.ph { aspect-ratio: 4 / 5; border-radius: var(--site-card-radius); margin-bottom: 8px; object-fit: cover; width: 100%; }
.empty { align-items: center; background: var(--site-surface); color: var(--site-muted); display: flex; font-size: 48px; font-weight: 800; justify-content: center; }
b { color: var(--site-heading); font-size: 19px; }
.role { color: var(--site-primary); font-weight: 600; }
p { font-size: 15px; }
</style>

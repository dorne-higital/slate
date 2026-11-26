<script setup lang="ts">
// Questions and answers. Pages add faqJsonLd(items) to their SEO so Google can show them.
defineProps<{ items: FaqItem[], title?: string }>()
</script>

<template>
    <section class="mk-faq">
        <div class="mk-wrap grid">
            <h2>{{ title ?? 'Questions people ask' }}</h2>
            <div>
                <details v-for="i in items" :key="i.q">
                    <summary>{{ i.q }}<span class="pm" aria-hidden="true">+</span></summary>
                    <p>{{ i.a }}</p>
                </details>
            </div>
        </div>
    </section>
</template>

<style scoped>
.mk-faq { padding: 88px 0; }
.grid { display: grid; gap: 48px; grid-template-columns: minmax(0, .8fr) minmax(0, 1.6fr); }
h2 { font-size: clamp(30px, 3.4vw, 42px); font-weight: 800; letter-spacing: -.035em; line-height: 1.06; margin: 0; }
details { border-top: 1px solid #d4d8df; }
details:last-child { border-bottom: 1px solid #d4d8df; }
summary { cursor: pointer; display: flex; font-size: 18px; font-weight: 700; gap: 24px; justify-content: space-between; list-style: none; padding: 20px 0; }
summary::-webkit-details-marker { display: none; }
.pm { flex: none; font-size: 24px; font-weight: 400; line-height: 1; transition: transform .2s; }
details[open] .pm { transform: rotate(45deg); }
details p { color: var(--text-body); font-size: 16px; line-height: 1.65; margin: 0 0 22px; max-width: 40em; }
@media (max-width: 960px) { .grid { gap: 24px; grid-template-columns: minmax(0, 1fr); } .mk-faq { padding: 56px 0; } }
</style>

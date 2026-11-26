<script setup lang="ts">
// Real websites made with Slate. Only real ones: no made-up customers.
const sites = [
    { name: 'Dan Horne', what: 'Web developer’s portfolio and services', url: 'https://www.danhorne.co.uk', host: 'danhorne.co.uk', image: '/og/example-danhorne.png' },
    { name: 'Dobie Dash', what: 'App website with store badges and screenshots', url: 'https://www.dobiedash.co.uk', host: 'dobiedash.co.uk', image: '/og/example-dobiedash.png' }
]
</script>

<template>
    <ul class="mk-examples">
        <li v-for="s in sites" :key="s.host">
            <a :href="s.url" target="_blank" rel="noopener">
                <span class="shot"><img :src="s.image" :alt="`The ${s.name} website`" loading="lazy" width="1200" height="630" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'"></span>
                <span class="meta">
                    <b>{{ s.name }}</b>
                    <span>{{ s.what }}</span>
                    <span class="host">{{ s.host }} ↗</span>
                </span>
            </a>
        </li>
    </ul>
</template>

<style scoped>
.mk-examples { display: grid; gap: 24px; grid-template-columns: repeat(2, minmax(0, 1fr)); list-style: none; margin: 0; padding: 0; }
a { background: var(--white); border-radius: 12px; box-shadow: 0 0 0 1px var(--line); color: inherit; display: flex; flex-direction: column; overflow: hidden; text-decoration: none; transition: box-shadow .15s, transform .15s; }
a:hover { box-shadow: 0 0 0 1px var(--quarry), 4px 4px 0 var(--lichen); transform: translate(-2px, -2px); }
.shot { aspect-ratio: 1200 / 630; background: var(--mist); display: block; }
.shot img { display: block; height: 100%; object-fit: cover; width: 100%; }
.meta { display: flex; flex-direction: column; gap: 4px; padding: 18px 20px; }
.meta b { font-size: 18px; }
.meta span { color: var(--text-body); font-size: 15px; }
.meta .host { color: var(--heather); font-weight: 600; }
@media (prefers-reduced-motion: reduce) { a { transition: none; } a:hover { transform: none; } }
@media (max-width: 760px) { .mk-examples { grid-template-columns: minmax(0, 1fr); } }
</style>

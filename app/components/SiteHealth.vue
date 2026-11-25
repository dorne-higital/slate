<script setup lang="ts">
// Site health on Overview: a score, then the things to fix (most important first), each with a link to fix it.
const props = defineProps<{ siteId: string }>()
interface Check { key: string, ok: boolean, level: 'high' | 'medium' | 'low', title: string, okTitle: string, detail: string, to: string, fixLabel: string, items?: string[] }
const { data } = useLazyAsyncData(`health-${props.siteId}`, () => $fetch<{ score: number, checks: Check[] }>(`/api/sites/${props.siteId}/health`), { server: false })

const todo = computed(() => (data.value?.checks ?? []).filter(c => !c.ok))
const passed = computed(() => (data.value?.checks ?? []).filter(c => c.ok))
const showPassed = ref(false)
const open = ref<string | null>(null)
const tone = computed(() => !data.value ? 'none' : data.value.score >= 85 ? 'good' : data.value.score >= 60 ? 'fair' : 'poor')
const verdict = computed(() => ({ good: 'Looking good', fair: 'A few things to tidy', poor: 'Worth some attention', none: '' })[tone.value])
const levelName = { high: 'Important', medium: 'Worth doing', low: 'Nice to have' }
// The ring: circumference of r=26
const C = 2 * Math.PI * 26
</script>

<template>
    <section v-if="data" class="panel health" aria-labelledby="health-h">
        <div class="h-top">
            <svg class="ring" :class="tone" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="26" class="track" />
                <circle cx="32" cy="32" r="26" class="bar" :stroke-dasharray="`${(data.score / 100) * C} ${C}`" transform="rotate(-90 32 32)" />
                <text x="32" y="37" text-anchor="middle">{{ data.score }}</text>
            </svg>
            <div class="h-title">
                <h2 id="health-h">Site health</h2>
                <span class="muted">{{ verdict }}. {{ todo.length ? `${todo.length} ${todo.length === 1 ? 'thing' : 'things'} to improve` : 'Nothing to fix right now' }}.</span>
            </div>
        </div>

        <ul v-if="todo.length" class="checks">
            <li v-for="c in todo" :key="c.key" :class="c.level">
                <span class="lvl" :title="levelName[c.level]" aria-hidden="true" />
                <div class="c-text">
                    <button type="button" class="c-title" :aria-expanded="open === c.key" @click="open = open === c.key ? null : c.key">
                        {{ c.title }}
                        <span class="visually-hidden">({{ levelName[c.level] }})</span>
                    </button>
                    <div v-if="open === c.key" class="c-more">
                        <p>{{ c.detail }}</p>
                        <ul v-if="c.items?.length" class="items"><li v-for="i in c.items" :key="i">{{ i }}</li></ul>
                    </div>
                </div>
                <NuxtLink class="btn btn-ghost btn-sm" :to="`/sites/${siteId}${c.to}`">{{ c.fixLabel }}</NuxtLink>
            </li>
        </ul>

        <button v-if="passed.length" type="button" class="btn btn-plain btn-sm passed-toggle" :aria-expanded="showPassed" @click="showPassed = !showPassed">
            {{ showPassed ? 'Hide' : 'Show' }} {{ passed.length }} {{ passed.length === 1 ? 'check' : 'checks' }} that passed
        </button>
        <ul v-if="showPassed" class="passed">
            <li v-for="c in passed" :key="c.key"><span class="tick" aria-hidden="true">✓</span>{{ c.okTitle }}</li>
        </ul>
    </section>
</template>

<style scoped>
.health { display: flex; flex-direction: column; gap: 14px; padding: 18px 20px; }
.h-top { align-items: center; display: flex; gap: 16px; }
.h-title h2 { font-size: 18px; margin: 0 0 2px; }
.ring .track { fill: none; stroke: var(--mist); stroke-width: 7; }
.ring .bar { fill: none; stroke-linecap: round; stroke-width: 7; transition: stroke-dasharray .6s ease; }
.ring.good .bar { stroke: var(--ok); }
.ring.fair .bar { stroke: var(--lichen); }
.ring.poor .bar { stroke: var(--danger); }
.ring text { fill: var(--text); font-family: var(--font); font-size: 17px; font-weight: 800; }
.checks, .passed, .items { list-style: none; margin: 0; padding: 0; }
.checks > li { align-items: flex-start; border-top: 1px solid var(--line-soft); display: flex; gap: 12px; padding: 12px 0; }
.lvl { border-radius: 50%; flex: none; height: 10px; margin-top: 6px; width: 10px; }
.high .lvl { background: var(--danger); }
.medium .lvl { background: var(--lichen); }
.low .lvl { background: var(--split); }
.c-text { flex: 1; min-width: 0; }
.c-title { background: none; border: 0; color: var(--text); cursor: pointer; font: inherit; font-size: 15px; font-weight: 600; padding: 0; text-align: left; }
.c-title:hover { text-decoration: underline; text-underline-offset: 3px; }
.c-more { color: var(--text-body); font-size: 14px; line-height: 1.55; padding-top: 6px; }
.c-more p { margin: 0 0 6px; }
.items { display: flex; flex-direction: column; gap: 2px; }
.items li { color: var(--text-muted); font-family: ui-monospace, monospace; font-size: 13px; overflow-wrap: anywhere; }
.passed-toggle { align-self: flex-start; }
.passed { display: flex; flex-direction: column; gap: 6px; }
.passed li { align-items: center; color: var(--text-body); display: flex; font-size: 14px; gap: 8px; }
.tick { color: var(--ok); font-weight: 800; }
@media (prefers-reduced-motion: reduce) { .ring .bar { transition: none; } }
</style>

<script setup lang="ts">
// Site health on Overview: a score, then the things to fix (most important first), each with a link to fix it.
const props = defineProps<{ siteId: string }>()
interface Item { label: string, sub?: string, to?: string, image?: string }
interface Check { key: string, ok: boolean, level: 'high' | 'medium' | 'low', title: string, okTitle: string, detail: string, to: string, fixLabel: string, items?: Item[], count?: number }
const { data } = useLazyAsyncData(`health-${props.siteId}`, () => $fetch<{ score: number, checks: Check[] }>(`/api/sites/${props.siteId}/health`), { server: false })

const todo = computed(() => (data.value?.checks ?? []).filter(c => !c.ok))
const passed = computed(() => (data.value?.checks ?? []).filter(c => c.ok))
const showPassed = ref(false)
// Lists show the first few; "Show all" opens the rest
const expanded = ref(new Set<string>())
const SHOW = 4
const shown = (c: Check) => expanded.value.has(c.key) ? c.items ?? [] : (c.items ?? []).slice(0, SHOW)
function expand(key: string) {
    expanded.value = new Set([...expanded.value, key])
}
const tone = computed(() => !data.value ? 'none' : data.value.score >= 85 ? 'good' : data.value.score >= 60 ? 'fair' : 'poor')
const verdict = computed(() => ({ good: 'Looking good', fair: 'A few things to tidy', poor: 'Worth some attention', none: '' })[tone.value])
const levelName = { high: 'Important', medium: 'Worth doing', low: 'Nice to have' }
// Collapsed by default to just the ring and score; the choice is remembered on this browser
const STORE = 'slate-health-open'
const isOpen = ref(false)
onMounted(() => {
    try {
        isOpen.value = localStorage.getItem(STORE) === '1'
    } catch {
        // Storage blocked: stays collapsed
    }
})
function toggle() {
    isOpen.value = !isOpen.value
    try {
        localStorage.setItem(STORE, isOpen.value ? '1' : '0')
    } catch {
        // Only for this visit
    }
}
// The ring: circumference of r=26
const C = 2 * Math.PI * 26
</script>

<template>
    <section v-if="data" class="panel health" aria-labelledby="health-h">
        <h2 id="health-h" class="h-head">
        <button type="button" class="h-top" :aria-expanded="isOpen" aria-controls="health-body" @click="toggle">
            <svg class="ring" :class="tone" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="26" class="track" />
                <circle cx="32" cy="32" r="26" class="bar" :stroke-dasharray="`${(data.score / 100) * C} ${C}`" transform="rotate(-90 32 32)" />
                <text x="32" y="37" text-anchor="middle">{{ data.score }}</text>
            </svg>
            <span class="h-title">
                <span class="h-name">Site health</span>
                <span class="muted">{{ verdict }}. {{ todo.length ? `${todo.length} ${todo.length === 1 ? 'thing' : 'things'} to improve` : 'Nothing to fix right now' }}.</span>
            </span>
            <span class="chev" :class="{ open: isOpen }" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 20 20"><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>
            <span class="visually-hidden">{{ isOpen ? 'Hide details' : 'Show details' }}</span>
        </button>
        </h2>

        <div v-show="isOpen" id="health-body" class="h-body">
        <ul v-if="todo.length" class="checks">
            <li v-for="c in todo" :key="c.key" :class="c.level">
                <span class="lvl" :title="levelName[c.level]" aria-hidden="true" />
                <div class="c-text">
                    <b class="c-title">{{ c.title }}<span class="visually-hidden"> ({{ levelName[c.level] }})</span></b>
                    <p class="c-detail">{{ c.detail }}</p>
                    <ul v-if="c.items?.length" class="items">
                        <li v-for="(i, n) in shown(c)" :key="n">
                            <img v-if="i.image" :src="i.image" alt="" class="thumb" loading="lazy" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'">
                            <component :is="i.to ? resolveComponent('NuxtLink') : 'span'" class="item" :to="i.to ? `/sites/${siteId}${i.to}` : undefined">
                                <span class="i-label">{{ i.label }}</span>
                                <span v-if="i.sub" class="i-sub">{{ i.sub }}</span>
                            </component>
                            <NuxtLink v-if="i.to" class="i-go" :to="`/sites/${siteId}${i.to}`" :aria-label="`Fix: ${i.label}`">Fix →</NuxtLink>
                        </li>
                    </ul>
                    <button v-if="(c.items?.length ?? 0) > SHOW && !expanded.has(c.key)" type="button" class="btn btn-plain btn-sm more" @click="expand(c.key)">Show all {{ c.count ?? c.items!.length }}</button>
                    <p v-else-if="(c.count ?? 0) > (c.items?.length ?? 0)" class="muted small">And {{ c.count! - c.items!.length }} more.</p>
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
        </div>
    </section>
</template>

<style scoped>
.health { display: flex; flex-direction: column; gap: 14px; padding: 18px 20px; }
.h-top { align-items: center; background: none; border: 0; border-radius: var(--radius-lg); color: inherit; cursor: pointer; display: flex; font: inherit; gap: 16px; margin: -6px; padding: 6px; text-align: left; width: calc(100% + 12px); }
.h-top:hover .chev { background: var(--mist); color: var(--text); }
.h-top:focus-visible { outline: 3px solid var(--lichen-focus); }
.h-title { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.chev { align-items: center; border-radius: 50%; color: var(--text-muted); display: flex; flex: none; height: 34px; justify-content: center; transition: transform .2s ease, background .15s; width: 34px; }
.chev.open { transform: rotate(180deg); }
.h-body { display: flex; flex-direction: column; gap: 14px; }
.h-head { font-size: inherit; font-weight: inherit; margin: 0; }
.h-name { color: var(--text); font-size: 18px; font-weight: 700; margin: 0 0 2px; }
.h-title .muted { font-size: 14px; font-weight: 400; }
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
.c-title { display: block; font-size: 15px; font-weight: 700; }
.c-detail { color: var(--text-body); font-size: 14px; line-height: 1.5; margin: 3px 0 0; max-width: 62em; }
.items { border: 1px solid var(--line-soft); border-radius: var(--radius-lg); display: flex; flex-direction: column; margin-top: 10px; overflow: hidden; }
.items li { align-items: center; display: flex; gap: 12px; padding: 8px 12px; }
.items li + li { border-top: 1px solid var(--line-soft); }
.items li:hover { background: var(--paper); }
.thumb { background: var(--mist); border-radius: 6px; flex: none; height: 40px; object-fit: cover; width: 56px; }
.item { color: inherit; display: flex; flex: 1; flex-direction: column; gap: 1px; min-width: 0; text-decoration: none; }
.i-label { font-size: 14px; font-weight: 600; overflow: hidden; overflow-wrap: anywhere; }
.i-sub { color: var(--text-muted); font-size: 13px; }
.i-go { flex: none; font-size: 13px; font-weight: 700; white-space: nowrap; }
.more { margin-top: 4px; }
.small { font-size: 13px; margin: 6px 0 0; }
.passed-toggle { align-self: flex-start; }
.passed { display: flex; flex-direction: column; gap: 6px; }
.passed li { align-items: center; color: var(--text-body); display: flex; font-size: 14px; gap: 8px; }
.tick { color: var(--ok); font-weight: 800; }
@media (prefers-reduced-motion: reduce) { .ring .bar, .chev { transition: none; } }
</style>

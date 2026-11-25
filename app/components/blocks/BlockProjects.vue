<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, intro?: string, layout?: string, filters?: string, which?: string, count?: string, buttonLabel?: string, buttonUrl?: string }>()
const all = inject<Ref<ProjectCard[]>>('siteProjects', ref([]))
const preview = inject<boolean>('blockPreview', false)
const layout = computed(() => choice('projects', 'layout', props.layout))

const sample: ProjectCard[] = [
    { title: 'Your first project', path: '#', category: 'New build', summary: 'Add projects in Projects and they show here.', cover: '', coverAlt: '', year: '2025', featured: true },
    { title: 'Another project', path: '#', category: 'Redesign', summary: '', cover: '', coverAlt: '', year: '2024', featured: false },
    { title: 'A personal one', path: '#', category: 'Personal', summary: '', cover: '', coverAlt: '', year: '2024', featured: false }
]
const source = computed(() => (all.value.length ? all.value : preview ? sample : []))
const chosen = computed(() => {
    let list = choice('projects', 'which', props.which) === 'featured' ? source.value.filter(p => p.featured) : source.value
    const n = Number.parseInt(props.count ?? '')
    if (n > 0) list = list.slice(0, n)
    return list
})
const categories = computed(() => [...new Set(chosen.value.map(p => p.category).filter(Boolean))])
const active = ref('')
const shown = computed(() => active.value ? chosen.value.filter(p => p.category === active.value) : chosen.value)
const showFilters = computed(() => choice('projects', 'filters', props.filters) === 'show' && categories.value.length > 1 && layout.value !== 'carousel')

// Carousel: scroll the track a card at a time
const track = ref<HTMLElement | null>(null)
const slide = (d: number) => track.value?.scrollBy({ left: d * (track.value.clientWidth * 0.8), behavior: 'smooth' })
const link = (p: ProjectCard) => (preview ? undefined : p.path)
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <div class="top">
                <BlockHeading :eyebrow="eyebrow" :heading="heading" :intro="intro" />
                <a v-if="buttonLabel" class="more" :href="buttonUrl || '#'">{{ buttonLabel }} →</a>
            </div>

            <div v-if="showFilters" class="chips" role="group" aria-label="Filter projects">
                <button type="button" :class="{ on: !active }" :aria-pressed="!active" @click="active = ''">All</button>
                <button v-for="c in categories" :key="c" type="button" :class="{ on: active === c }" :aria-pressed="active === c" @click="active = c">{{ c }}</button>
            </div>

            <ul v-if="layout === 'rows'" class="rows">
                <li v-for="(p, i) in shown" :key="p.path + i" class="row" :class="{ flip: i % 2 }">
                    <component :is="link(p) ? 'a' : 'span'" :href="link(p)" class="row-img">
                        <img v-if="p.cover" :src="p.cover" :alt="p.coverAlt" loading="lazy">
                        <span v-else class="ph" aria-hidden="true" />
                    </component>
                    <div class="row-words">
                        <span v-if="p.category" class="cat">{{ p.category }}</span>
                        <h3><component :is="link(p) ? 'a' : 'span'" :href="link(p)">{{ p.title }}</component></h3>
                        <p v-if="p.summary" class="blk-muted">{{ p.summary }}</p>
                        <component :is="link(p) ? 'a' : 'span'" v-if="link(p) || preview" :href="link(p)" class="blk-btn outline">View project</component>
                    </div>
                </li>
            </ul>

            <div v-else :class="layout === 'carousel' ? 'car' : ''">
                <ul ref="track" :class="layout === 'carousel' ? 'track' : 'grid'">
                    <li v-for="(p, i) in shown" :key="p.path + i">
                        <component :is="link(p) ? 'a' : 'div'" :href="link(p)" class="card">
                            <span class="card-img">
                                <img v-if="p.cover" :src="p.cover" :alt="p.coverAlt" loading="lazy">
                                <span v-else class="ph" aria-hidden="true" />
                                <span v-if="p.category" class="pill">{{ p.category }}</span>
                            </span>
                            <span class="card-foot"><b>{{ p.title }}</b><span class="arrow" aria-hidden="true">↗</span></span>
                        </component>
                    </li>
                </ul>
                <div v-if="layout === 'carousel' && shown.length > 1" class="car-btns">
                    <button type="button" aria-label="Previous projects" @click="slide(-1)">‹</button>
                    <button type="button" aria-label="Next projects" @click="slide(1)">›</button>
                </div>
            </div>
            <p v-if="!shown.length" class="blk-muted">No projects yet.</p>
        </div>
    </section>
</template>

<style scoped>
.top { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
.more { color: var(--site-primary); font-weight: 700; text-decoration: none; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chips button { background: var(--site-bg); border: 1.5px solid color-mix(in srgb, currentcolor 15%, transparent); border-radius: 999px; color: var(--site-heading); cursor: pointer; font: inherit; font-size: 15px; font-weight: 600; padding: 8px 18px; }
.chips button.on { background: var(--site-primary); border-color: var(--site-primary); color: var(--site-primary-text); }
.grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); list-style: none; margin: 0; padding: 0; }
.card { background: var(--site-bg); border: 1.5px solid color-mix(in srgb, currentcolor 10%, transparent); border-radius: calc(var(--site-card-radius) + 4px); color: var(--site-heading); display: flex; flex-direction: column; height: 100%; overflow: hidden; text-decoration: none; transition: transform .2s, box-shadow .2s; }
a.card:hover { box-shadow: 0 16px 40px rgb(0 0 0 / 10%); transform: translateY(-4px); }
.card-img { aspect-ratio: 4 / 3; background: var(--site-surface); display: block; overflow: hidden; position: relative; }
.card-img img { height: 100%; object-fit: cover; transition: transform .4s; width: 100%; }
a.card:hover .card-img img { transform: scale(1.04); }
.ph { background: linear-gradient(135deg, var(--site-surface), color-mix(in srgb, var(--site-primary) 18%, var(--site-surface))); display: block; height: 100%; width: 100%; }
.pill { background: color-mix(in srgb, var(--site-primary) 14%, white); border-radius: 999px; color: var(--site-primary); font-size: 14px; font-weight: 700; left: 12px; padding: 4px 12px; position: absolute; top: 12px; }
.card-foot { align-items: center; display: flex; justify-content: space-between; padding: 18px 20px; }
.card-foot b { font-size: 19px; }
.arrow { font-size: 18px; }
.car { display: flex; flex-direction: column; gap: 16px; }
.track { display: grid; gap: 24px; grid-auto-columns: minmax(280px, calc((100% - 48px) / 3)); grid-auto-flow: column; list-style: none; margin: 0; overflow-x: auto; padding: 0 0 8px; scroll-snap-type: x mandatory; scrollbar-width: none; }
.track li { scroll-snap-align: start; }
.car-btns { display: flex; gap: 8px; justify-content: flex-end; }
.car-btns button { background: var(--site-bg); border: 1.5px solid color-mix(in srgb, currentcolor 15%, transparent); border-radius: var(--site-radius); color: var(--site-heading); cursor: pointer; font-size: 20px; height: 40px; width: 40px; }
.rows { display: flex; flex-direction: column; gap: 72px; list-style: none; margin: 0; padding: 0; }
.row { align-items: center; display: grid; gap: 48px; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
.row.flip .row-img { order: 2; }
.row-img { aspect-ratio: 4 / 3; background: var(--site-surface); border-radius: calc(var(--site-card-radius) + 4px); display: block; overflow: hidden; }
.row-img img { height: 100%; object-fit: cover; width: 100%; }
.row-words { align-items: flex-start; display: flex; flex-direction: column; gap: 14px; }
.row-words h3 { font-family: var(--site-heading-font); font-size: clamp(26px, 3vw, 36px); margin: 0; }
.row-words h3 a { color: var(--site-heading); text-decoration: none; }
.cat { color: var(--site-primary); font-size: 14px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
@media (max-width: 800px) { .row { gap: 20px; grid-template-columns: minmax(0, 1fr); } .row.flip .row-img { order: 0; } .track { grid-auto-columns: 82%; } }
</style>

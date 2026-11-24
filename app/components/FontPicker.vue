<script setup lang="ts">
// Search every Google Font, see each name in its own font, pick one.
const props = defineProps<{ id: string, label: string, modelValue: string }>()
const emit = defineEmits<{ pick: [font: GoogleFont] }>()

const open = ref(false)
const query = ref('')
const kind = ref<FontKind | ''>('')
const shown = computed(() => {
    const q = query.value.trim().toLowerCase()
    return googleFonts().filter(f => (!kind.value || f.kind === kind.value) && (!q || f.name.toLowerCase().includes(q))).slice(0, 40)
})
// One small stylesheet with just the letters of the names on screen
const previewHref = computed(() => {
    if (!open.value || !shown.value.length) return ''
    const chars = [...new Set(shown.value.map(f => f.name).join(''))].join('')
    return `https://fonts.googleapis.com/css2?${shown.value.map(f => `family=${fontCss(f)}`).join('&')}&text=${encodeURIComponent(chars)}&display=swap`
})
useHead(() => ({ link: previewHref.value ? [{ rel: 'stylesheet', href: previewHref.value, key: `fp-${props.id}` }] : [] }))
const current = computed(() => findGoogleFont(props.modelValue))
function choose(f: GoogleFont) {
    emit('pick', f)
    open.value = false
    query.value = ''
}
const search = ref<HTMLInputElement | null>(null)
watch(open, v => v && nextTick(() => search.value?.focus()))
</script>

<template>
    <div class="fp field">
        <span :id="`${id}-l`" class="lb">{{ label }}</span>
        <button :id="id" type="button" class="inp cur" :aria-expanded="open" :aria-labelledby="`${id}-l ${id}`" @click="open = !open">
            <span :style="{ fontFamily: `'${modelValue}'` }">{{ modelValue }}</span>
            <span class="muted small">{{ FONT_KINDS.find(k => k.key === current?.kind)?.label }} ▾</span>
        </button>
        <div v-if="open" class="pop" @keydown.esc="open = false">
            <label class="visually-hidden" :for="`${id}-q`">Search Google Fonts</label>
            <input :id="`${id}-q`" ref="search" v-model="query" class="inp" type="search" placeholder="Search 1,600+ Google Fonts">
            <div class="kinds" role="group" aria-label="Kind of font">
                <button type="button" :class="{ on: !kind }" :aria-pressed="!kind" @click="kind = ''">All</button>
                <button v-for="k in FONT_KINDS" :key="k.key" type="button" :class="{ on: kind === k.key }" :aria-pressed="kind === k.key" @click="kind = k.key">{{ k.label }}</button>
            </div>
            <ul class="list">
                <li v-for="f in shown" :key="f.name">
                    <button type="button" :class="{ on: f.name === modelValue }" :aria-pressed="f.name === modelValue" @click="choose(f)">
                        <span class="name" :style="{ fontFamily: `'${f.name}', system-ui` }">{{ f.name }}</span>
                    </button>
                </li>
                <li v-if="!shown.length" class="muted none">No Google Font matches “{{ query }}”.</li>
            </ul>
            <p class="muted small foot">Most popular first. Type to find any font on fonts.google.com.</p>
        </div>
    </div>
</template>

<style scoped>
.fp { position: relative; }
.lb { font-size: 14px; font-weight: 600; }
.cur { align-items: center; background: var(--white); cursor: pointer; display: flex; font-size: 17px; height: 46px; justify-content: space-between; text-align: left; width: 100%; }
.small { font-size: 12px; }
.pop { background: var(--white); border-radius: var(--radius-lg); box-shadow: 0 0 0 1px var(--line), 0 16px 40px rgb(46 52 69 / 18%); display: flex; flex-direction: column; gap: 10px; left: 0; padding: 12px; position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; }
.pop .inp { font-size: 15px; height: 40px; }
.kinds { display: flex; flex-wrap: wrap; gap: 6px; }
.kinds button { background: var(--mist); border: 0; border-radius: 999px; color: var(--text-body); cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; padding: 5px 10px; }
.kinds button.on { background: var(--quarry); color: var(--white); }
.list { list-style: none; margin: 0; max-height: 320px; overflow-y: auto; padding: 0; }
.list button { background: none; border: 0; border-radius: var(--radius); color: var(--quarry); cursor: pointer; display: block; padding: 8px 10px; text-align: left; width: 100%; }
.list button:hover, .list button.on { background: var(--mist); }
.name { font-size: 20px; }
.none { padding: 10px; }
.foot { margin: 0; }
</style>

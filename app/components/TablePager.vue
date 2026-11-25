<script setup lang="ts">
// "Showing 1–25 of 80", rows per page, and page buttons, under any table that uses useDataTable.
const props = defineProps<{ table: DataTable, noun?: string }>()
const pages = computed(() => {
    const n = props.table.pageCount
    const cur = props.table.page
    if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
    const set = new Set([1, n, cur - 1, cur, cur + 1].filter(p => p >= 1 && p <= n))
    const list = [...set].sort((a, b) => a - b)
    const out: (number | '…')[] = []
    list.forEach((p, i) => {
        if (i && p - list[i - 1]! > 1) out.push('…')
        out.push(p)
    })
    return out
})
</script>

<template>
    <div v-if="table.total > PAGE_SIZES[0]!" class="pager">
        <span class="muted">Showing {{ table.from }}–{{ table.to }} of {{ table.total }}{{ noun ? ` ${noun}` : '' }}</span>
        <label class="size">
            <span class="muted">Per page</span>
            <select v-model.number="table.pageSize" class="sel">
                <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}</option>
            </select>
        </label>
        <nav v-if="table.pageCount > 1" class="nav" aria-label="Pages">
            <button type="button" class="pg" :disabled="table.page === 1" aria-label="Previous page" @click="table.page--">‹</button>
            <template v-for="(p, i) in pages" :key="i">
                <span v-if="p === '…'" class="gap" aria-hidden="true">…</span>
                <button v-else type="button" class="pg" :class="{ on: p === table.page }" :aria-current="p === table.page ? 'page' : undefined" @click="table.page = p">{{ p }}</button>
            </template>
            <button type="button" class="pg" :disabled="table.page === table.pageCount" aria-label="Next page" @click="table.page++">›</button>
        </nav>
    </div>
</template>

<style scoped>
.pager { align-items: center; border-top: 1px solid var(--line-soft); display: flex; flex-wrap: wrap; gap: 10px 18px; padding: 12px 16px; }
.pager > .muted { font-size: 14px; }
.size { align-items: center; display: inline-flex; gap: 8px; }
.size .muted { font-size: 14px; }
.sel { background: var(--white); border: 1.5px solid var(--line); border-radius: var(--radius); font: inherit; font-size: 14px; height: 32px; padding: 0 6px; }
.nav { align-items: center; display: flex; gap: 4px; margin-left: auto; }
.pg { background: var(--white); border: 0; border-radius: var(--radius); box-shadow: inset 0 0 0 1px var(--line); color: var(--text); cursor: pointer; font: inherit; font-size: 14px; font-weight: 600; height: 32px; min-width: 32px; padding: 0 8px; }
.pg:hover:not(:disabled) { box-shadow: inset 0 0 0 1.5px var(--quarry); }
.pg.on { background: var(--quarry); box-shadow: none; color: var(--white); }
.pg:disabled { cursor: default; opacity: .4; }
.gap { color: var(--text-muted); padding: 0 4px; }
</style>

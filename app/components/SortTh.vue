<script setup lang="ts">
// A column header that sorts its table (see useDataTable). Without `col` it's a plain header.
defineProps<{ table: DataTable, col?: string, label: string, end?: boolean }>()
</script>

<template>
    <th v-if="col" scope="col" :aria-sort="table.ariaSort(col)" :class="{ end }">
        <button type="button" class="sort" :class="{ on: table.sortKey === col }" @click="table.sortBy(col)">
            {{ label }}
            <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
                <path d="M5 1 2 4.5h6z" :class="{ lit: table.sortKey === col && table.sortDir === 'asc' }" />
                <path d="M5 11 2 7.5h6z" :class="{ lit: table.sortKey === col && table.sortDir === 'desc' }" />
            </svg>
        </button>
    </th>
    <th v-else scope="col" :class="{ end }"><slot>{{ label }}</slot></th>
</template>

<style scoped>
.sort { align-items: center; background: none; border: 0; border-radius: 4px; color: inherit; cursor: pointer; display: inline-flex; font: inherit; gap: 6px; margin: -2px -4px; padding: 2px 4px; text-transform: inherit; }
.sort:hover { background: var(--mist); color: var(--text); }
.sort:focus-visible { outline: 2px solid var(--quarry); }
.sort.on { color: var(--text); }
svg path { fill: currentcolor; opacity: .3; }
svg path.lit { opacity: 1; }
.end { text-align: right; }
</style>

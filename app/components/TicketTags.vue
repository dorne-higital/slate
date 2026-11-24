<script setup lang="ts">
// Colour-coded type tag, plus a P1/P2/P3 badge for bugs.
const props = defineProps<{ category: TicketCategory, severity?: TicketSeverity | null }>()
const cat = computed(() => findTicketCategory(props.category))
const sev = computed(() => TICKET_SEVERITIES.find(s => s.key === props.severity))
</script>

<template>
    <span class="tt">
        <span v-if="sev" class="sev" :style="{ background: sev.colour.bg, color: sev.colour.fg }" :title="sev.desc">{{ sev.key.toUpperCase() }}</span>
        <span v-if="cat" class="cat" :style="{ background: cat.colour.bg, color: cat.colour.fg }">
            <svg width="13" height="13" viewBox="0 0 18 18" aria-hidden="true"><path :d="cat.icon" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
            {{ cat.name }}
        </span>
    </span>
</template>

<style scoped>
.tt { align-items: center; display: inline-flex; flex-wrap: wrap; gap: 5px; }
.sev, .cat { align-items: center; border-radius: 999px; display: inline-flex; font-size: 11px; font-weight: 800; gap: 4px; padding: 2px 8px; white-space: nowrap; }
.sev { letter-spacing: .03em; }
</style>

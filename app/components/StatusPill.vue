<script setup lang="ts">
const props = defineProps<{ status: PageStatus, changed?: boolean }>()

const look = computed(() => {
    if (props.status === 'draft') return { label: 'Draft', dot: '#B2B8C3', fg: '#555C6E' }
    if (props.changed) return { label: 'Unpublished changes', dot: '#E8A33A', fg: '#7A4B05' }
    return { label: 'Published', dot: '#5B5773', fg: '#2E3445' }
})
</script>

<template>
    <span class="pill" :style="{ color: look.fg }">
        <i :style="{ background: look.dot }" />{{ look.label }}
    </span>
</template>

<style scoped>
.pill { align-items: center; display: inline-flex; font-size: 13px; font-weight: 600; gap: 7px; white-space: nowrap; }
.pill i { border-radius: 50%; display: block; height: 8px; width: 8px; }
</style>

<script setup lang="ts">
defineProps<{ ok: boolean, label: string }>()
</script>

<template>
    <span class="pill" :style="{ color: ok ? '#2E3445' : '#7A4B05' }">
        <i :style="{ background: ok ? '#5B5773' : '#E8A33A' }" />{{ label }}
    </span>
</template>

<style scoped>
.pill { align-items: center; display: inline-flex; font-size: 13px; font-weight: 600; gap: 7px; white-space: nowrap; }
.pill i { border-radius: 50%; display: block; height: 8px; width: 8px; }
</style>

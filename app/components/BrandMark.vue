<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 26 })
</script>

<template>
    <span class="brand" :style="{ fontSize: `${size}px` }">
        <svg :width="size * 1.15" :height="size" viewBox="0 0 30 26" aria-hidden="true">
            <path d="M6 18h22l-4 6H2z" fill="#8C93A3" />
            <path d="M6 10h22l-4 6H2z" fill="#5B5773" />
            <path d="M6 2h22l-4 6H2z" fill="#2E3445" />
        </svg>
        <span>slate</span>
    </span>
</template>

<style scoped>
.brand {
    align-items: center;
    color: var(--quarry);
    display: inline-flex;
    font-weight: 900;
    gap: .38em;
    letter-spacing: -.04em;
    line-height: 1;
}
</style>

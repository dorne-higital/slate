<script setup lang="ts">
defineProps<{ blocks: Block[] }>()
</script>

<template>
    <template v-for="block in blocks" :key="block.id">
        <BlockView :block="block" />
    </template>
</template>

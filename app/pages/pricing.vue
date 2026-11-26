<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const page = useMarketingSeo('/pricing')
</script>

<template>
    <div class="mk-wrap">
        <h1>{{ page.h1 }}</h1>
    </div>
</template>

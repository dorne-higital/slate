<script setup lang="ts">
// Slate's home page. While NUXT_PUBLIC_COMING_SOON is on, visitors get the coming-soon page;
// platform admins can still see the full page at /?full=1.
const route = useRoute()
const { comingSoon } = useRuntimeConfig().public
const { me, ensure } = useMe()
await ensure()
const showFull = computed(() => !comingSoon || (route.query.full === '1' && !!me.value?.isPlatformAdmin))
</script>

<template>
    <MarketingHome v-if="showFull" />
    <ComingSoon v-else />
</template>

<script setup lang="ts">
// Slate's home page. While NUXT_PUBLIC_COMING_SOON is on, visitors get the coming-soon page;
// platform admins see the full site.
definePageMeta({ layout: false })
const { comingSoon } = useRuntimeConfig().public
const { me, ensure } = useMe()
await ensure()
const showFull = computed(() => !comingSoon || !!me.value?.isPlatformAdmin)
</script>

<template>
    <NuxtLayout v-if="showFull" name="marketing">
        <MarketingHome />
    </NuxtLayout>
    <ComingSoon v-else />
</template>

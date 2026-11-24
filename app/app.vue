<script setup lang="ts">
// Slate's own icon, only on Slate's host. Client sites set their own favicon (SiteShell), so they never show Slate's.
const host = import.meta.server ? useRequestURL().host : window.location.host
if (isAppHost(host, useRuntimeConfig().public.appHost)) {
    useHead({
        link: [
            { rel: 'icon', type: 'image/svg+xml', href: '/slate-icon.svg' },
            { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/slate-icon-32.png' },
            { rel: 'apple-touch-icon', sizes: '180x180', href: '/slate-icon-180.png' }
        ],
        meta: [{ name: 'theme-color', content: '#2E3445' }]
    })
}
</script>

<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

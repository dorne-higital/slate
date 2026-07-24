<template>
    <p>Loading…</p>
</template>

<script setup lang="ts">
// auth.global.ts always redirects an authenticated visitor away from '/'
// (to /admin or /sites/[siteId]) and an unauthenticated one to /login, so
// this renders only for the brief moment before that redirect resolves.
</script>

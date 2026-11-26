<script setup lang="ts">
defineProps<{ title?: string, text?: string }>()
</script>

<template>
    <section class="mk-cta">
        <div class="strata" aria-hidden="true" />
        <div class="mk-wrap inner">
            <h2>{{ title ?? 'Start with a blank slate.' }}</h2>
            <p>{{ text ?? `Try everything free for ${TRIAL_DAYS} days. No card needed, and your site is live on a free address straight away.` }}</p>
            <div class="ctas">
                <NuxtLink class="btn btn-lichen btn-xl" to="/signup">Start your free trial</NuxtLink>
                <NuxtLink class="btn btn-ghost-light btn-xl" to="/pricing">See pricing</NuxtLink>
            </div>
        </div>
    </section>
</template>

<style scoped>
.mk-cta { background: var(--heather); color: var(--white); }
.strata { background: linear-gradient(#5b5773 0 3px, #8c93a3 3px 6px, #c3c8d1 6px 9px); height: 9px; }
.inner { align-items: flex-start; display: flex; flex-direction: column; gap: 20px; padding-bottom: 88px; padding-top: 80px; }
h2 { color: var(--white); font-size: clamp(36px, 5vw, 60px); font-weight: 900; letter-spacing: -.045em; line-height: 1; margin: 0; max-width: 14em; }
p { color: #e6e4ee; font-size: 19px; line-height: 1.55; margin: 0; max-width: 34em; }
.ctas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
.btn-ghost-light { background: transparent; box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / 70%); color: var(--white); }
.btn-ghost-light:hover { background: rgb(255 255 255 / 12%); }
</style>

<script setup lang="ts">
const route = useRoute()
const siteId = computed(() => String(route.params.siteId))

// Trial ending soon, site paused, or a failed payment: say so on every CMS page
const { data: site } = useAsyncData(() => `site-billing-${siteId.value}`, () => $fetch<{ billing: BillingSummary }>(`/api/sites/${siteId.value}`), { watch: [siteId], lazy: true, server: false })
const notice = computed(() => {
    const b = site.value?.billing
    if (!b || route.path.endsWith('/billing')) return null
    if (b.status === 'expired') return { warn: true, text: b.youPay ? 'Your site is paused because the free trial has ended. Choose a plan to put it back online.' : 'This site is paused. Ask its owner to choose a plan.' }
    if (b.status === 'past_due' && b.youPay) return { warn: true, text: 'Your last payment didn’t go through. Update your card to keep your site online.' }
    if (b.status === 'trial' && b.youPay && b.trialEndsAt) {
        const days = Math.ceil((new Date(b.trialEndsAt).getTime() - Date.now()) / 86400000)
        if (days <= 5) return { warn: false, text: `${days <= 0 ? 'Your free trial ends today' : `${days} ${days === 1 ? 'day' : 'days'} left of your free trial`}. Choose a plan to keep your site online.` }
    }
    return null
})
</script>

<template>
    <div class="cms">
        <CmsSidebar :site-id="siteId" />
        <main class="cms-main">
            <div v-if="notice" class="bill-note" :class="{ warn: notice.warn }" role="status">
                <span>{{ notice.text }}</span>
                <NuxtLink v-if="site?.billing.youPay" :to="`/sites/${siteId}/billing`" class="btn btn-dark btn-sm">Choose a plan</NuxtLink>
            </div>
            <slot />
        </main>
    </div>
</template>

<style scoped>
.cms { display: grid; grid-template-columns: 248px minmax(0, 1fr); min-height: 100vh; }
.bill-note { align-items: center; background: var(--paper); border-radius: var(--radius-lg); display: flex; flex-wrap: wrap; font-size: 14px; gap: 12px; justify-content: space-between; padding: 12px 16px; }
.bill-note.warn { background: #fbeceb; color: var(--danger); }
.cms-main { display: flex; flex-direction: column; gap: 24px; min-width: 0; padding: 28px 40px 48px; }

@media (max-width: 860px) {
    .cms { grid-template-columns: minmax(0, 1fr); }
    .cms :deep(.sidebar) { min-height: 0; position: static; }
    .cms-main { padding: 24px 16px 40px; }
}
</style>

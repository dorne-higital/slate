<script setup lang="ts">
// Every domain bought through Slate. Failed orders come first, with Try again and Mark as done.
definePageMeta({ middleware: 'auth' })
const { me } = useMe()
if (me.value && !me.value.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
useHead({ title: 'Domains · Slate admin' })

interface AdminOrder { id: string, domain: string, price: number, status: DomainOrderStatus, simulated: boolean, error: string | null, expiresAt: string | null, createdAt: string, updatedAt: string, siteId: string | null, site: string | null, owner: string | null, email: string | null, onCloudflare: boolean }
const { data: orders, refresh } = await useAsyncData('admin-domains', () => useRequestFetch()<AdminOrder[]>('/api/admin/domains'), { default: () => [] })
const failed = computed(() => orders.value.filter(o => o.status === 'failed'))
const others = computed(() => orders.value.filter(o => o.status !== 'failed'))
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const statusText: Record<DomainOrderStatus, string> = { pending_payment: 'Waiting for payment', registering: 'Registering', active: 'Active', failed: 'Needs help', cancelled: 'Not renewing' }

const busy = ref<string | null>(null)
const result = ref<{ id: string, ok: boolean, text: string } | null>(null)
async function act(o: AdminOrder, action: 'retry' | 'done' | 'move-dns') {
    busy.value = o.id
    result.value = null
    try {
        const res = await $fetch<{ status?: DomainOrderStatus, error?: string | null }>(`/api/admin/domains/${o.id}/${action}`, { method: 'POST' })
        result.value = action === 'move-dns'
            ? { id: o.id, ok: true, text: `${o.domain} is moving to Cloudflare. The bare address will redirect to www once Cloudflare sees the new nameservers, usually within an hour.` }
            : action === 'done'
            ? { id: o.id, ok: true, text: `${o.domain} is marked as done.` }
            : res.status === 'active'
                ? { id: o.id, ok: true, text: `${o.domain} is set up and connected.` }
                : { id: o.id, ok: false, text: `Still didn’t work: ${res.error ?? 'no reason given'}` }
    } catch (err) {
        result.value = { id: o.id, ok: false, text: (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'That didn’t work. Please try again.' }
    } finally {
        busy.value = null
        await refresh()
    }
}
</script>

<template>
    <div class="admin">
        <AdminHeader />
        <main class="wrap">
            <div class="head">
                <div>
                    <h1>Domains</h1>
                    <p class="muted">Domains customers bought through Slate. If setting one up fails after they’ve paid, it shows here. Try again once the cause is fixed (often the name.com balance), or finish it by hand at name.com and mark it as done.</p>
                </div>
                <button class="btn btn-ghost btn-sm" type="button" @click="() => refresh()">Refresh</button>
            </div>

            <p v-if="result" :class="result.ok ? 'ok-box' : 'error-box'" role="status">{{ result.text }}</p>

            <section class="panel" aria-labelledby="f-h">
                <h2 id="f-h">Need your help <span class="count">{{ failed.length }}</span></h2>
                <ul class="list">
                    <li v-for="o in failed" :key="o.id" class="fail">
                        <div class="what">
                            <b>{{ o.domain }}</b>
                            <span class="muted small">{{ o.site ?? 'No site' }} · {{ o.owner ?? 'Unknown' }}{{ o.email ? ` (${o.email})` : '' }} · paid {{ day(o.createdAt) }} · {{ formatPence(o.price) }} a year<template v-if="o.simulated"> · test</template></span>
                            <span class="err">{{ o.error ?? 'No reason recorded' }}</span>
                        </div>
                        <div class="acts">
                            <button class="btn btn-dark btn-sm" type="button" :disabled="!!busy" @click="act(o, 'retry')">{{ busy === o.id ? 'Trying…' : 'Try again' }}</button>
                            <button class="btn btn-ghost btn-sm" type="button" :disabled="!!busy" @click="act(o, 'done')">Mark as done</button>
                            <NuxtLink v-if="o.siteId" class="btn btn-plain btn-sm" :to="`/sites/${o.siteId}/domains`">Open site</NuxtLink>
                        </div>
                    </li>
                    <li v-if="!failed.length" class="empty muted">Nothing needs your help.</li>
                </ul>
            </section>

            <section class="panel" aria-labelledby="a-h">
                <h2 id="a-h">All orders <span class="count">{{ others.length }}</span></h2>
                <ul class="list">
                    <li v-for="o in others" :key="o.id">
                        <div class="what">
                            <b>{{ o.domain }}</b>
                            <span class="muted small">{{ o.site ?? 'No site' }} · {{ o.owner ?? 'Unknown' }} · bought {{ day(o.createdAt) }}<template v-if="o.expiresAt"> · renews {{ day(o.expiresAt) }}</template> · {{ formatPence(o.price) }} a year</span>
                        </div>
                        <span class="tag-row">
                            <button v-if="!o.simulated && !o.onCloudflare && (o.status === 'active' || o.status === 'cancelled')" class="btn btn-ghost btn-sm" type="button" :disabled="!!busy" title="So the bare domain redirects to www with HTTPS" @click="act(o, 'move-dns')">{{ busy === o.id ? 'Moving…' : 'Move DNS to Cloudflare' }}</button>
                            <span v-if="o.onCloudflare" class="muted small">DNS on Cloudflare</span>
                            <span class="tag" :class="o.status">{{ statusText[o.status] }}<template v-if="o.simulated"> (test)</template></span>
                        </span>
                    </li>
                    <li v-if="!others.length" class="empty muted">No domains bought yet.</li>
                </ul>
            </section>
        </main>
    </div>
</template>

<style scoped>
.admin { background: var(--paper); min-height: 100vh; }
.wrap { display: flex; flex-direction: column; gap: 20px; margin: 0 auto; max-width: 1200px; padding: 28px 24px 56px; }
.head { align-items: flex-end; display: flex; gap: 16px; justify-content: space-between; }
.head p { margin: 6px 0 0; max-width: 70ch; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { align-items: center; display: flex; font-size: 17px; gap: 8px; margin: 0; padding: 16px 20px 6px; }
.count { background: var(--mist); border-radius: 999px; font-size: 12px; padding: 2px 8px; }
.list { list-style: none; margin: 0; padding: 0; }
.list > li { align-items: center; display: flex; flex-wrap: wrap; gap: 10px 16px; justify-content: space-between; padding: 12px 20px; }
.list > li + li { border-top: 1px solid var(--line-soft); }
.what { display: flex; flex: 1 1 320px; flex-direction: column; gap: 3px; min-width: 0; }
.what b { overflow-wrap: anywhere; }
.err { background: #fbeceb; border-radius: var(--radius); color: var(--danger); font-size: 13px; margin-top: 4px; overflow-wrap: anywhere; padding: 6px 10px; }
.tag-row { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; }
.acts { display: flex; flex-wrap: wrap; gap: 8px; }
.small { font-size: 13px; }
.tag { background: var(--mist); border-radius: 999px; font-size: 12px; font-weight: 700; padding: 3px 9px; }
.tag.active { background: #e8f3ec; color: var(--ok-text); }
.empty { padding: 16px 20px; }
.ok-box { background: #e8f3ec; border-radius: var(--radius); color: var(--ok-text); margin: 0; padding: 10px 14px; }
</style>

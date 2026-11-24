<script setup lang="ts">
// Server errors across Slate, grouped by kind. Platform admins only (the API answers 404 to anyone else).
definePageMeta({ middleware: 'auth' })
const { me } = useMe()
if (me.value && !me.value.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
useHead({ title: 'Errors · Slate admin' })

interface ErrorGroup { fingerprint: string, total: number, today: number, firstSeen: string, lastSeen: string, message: string, status: number, method: string | null, path: string | null, host: string | null, stack: string | null }
const { data: groups, refresh } = await useAsyncData('admin-errors', () => useRequestFetch()<ErrorGroup[]>('/api/admin/errors'))
const open = ref<string | null>(null)
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
async function clear(fp: string) {
    await $fetch(`/api/admin/errors/${fp}`, { method: 'DELETE' }).catch(() => {})
    await refresh()
}
</script>

<template>
    <div class="admin">
        <AdminHeader />
        <main class="wrap">
            <div class="head">
                <div>
                    <h1>Errors</h1>
                    <p class="muted">Things that went wrong on Slate’s server, or in visitors’ browsers, in the last 30 days, grouped by kind. You’re emailed the first time each kind appears in an hour. Clear one once it’s fixed; it comes back if it happens again.</p>
                </div>
                <button class="btn btn-ghost btn-sm" type="button" @click="() => refresh()">Refresh</button>
            </div>
            <section class="panel">
                <ul class="list">
                    <li v-for="g in groups" :key="g.fingerprint">
                        <button class="row" type="button" :aria-expanded="open === g.fingerprint" @click="open = open === g.fingerprint ? null : g.fingerprint">
                            <span class="code" :class="{ browser: !g.status }">{{ g.status || 'Browser' }}</span>
                            <span class="what">
                                <b>{{ g.message }}</b>
                                <span class="muted small">{{ g.method }} {{ g.path ?? '(scheduled job)' }}{{ g.host ? ` · ${g.host}` : '' }}</span>
                            </span>
                            <span class="nums">
                                <span><b>{{ g.today }}</b> today</span>
                                <span class="muted small">{{ g.total }} in 30 days · last {{ when(g.lastSeen) }}</span>
                            </span>
                        </button>
                        <div v-if="open === g.fingerprint" class="detail">
                            <p class="muted small">First seen {{ when(g.firstSeen) }}.</p>
                            <pre v-if="g.stack">{{ g.stack }}</pre>
                            <button class="btn btn-ghost btn-sm" type="button" @click="clear(g.fingerprint)">Clear, it’s fixed</button>
                        </div>
                    </li>
                    <li v-if="!groups?.length" class="empty muted">No errors. Everything’s running smoothly.</li>
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
.list { list-style: none; margin: 0; padding: 0; }
.list > li + li { border-top: 1px solid var(--line-soft); }
.row { align-items: center; background: none; border: 0; color: var(--quarry); cursor: pointer; display: grid; font: inherit; gap: 16px; grid-template-columns: 56px minmax(0, 1fr) 220px; padding: 14px 20px; text-align: left; width: 100%; }
.row:hover { background: var(--paper); }
.code { background: #fbeceb; border-radius: var(--radius); color: var(--danger); font-weight: 800; padding: 4px 0; text-align: center; }
.code.browser { background: #eef2fb; color: #22477a; font-size: 11px; }
.what { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.what b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nums { display: flex; flex-direction: column; gap: 2px; text-align: right; }
.small { font-size: 13px; }
.detail { display: flex; flex-direction: column; gap: 10px; padding: 0 20px 16px 92px; }
.detail p { margin: 0; }
pre { background: var(--quarry); border-radius: var(--radius); color: #e6e8ee; font-size: 12px; max-height: 320px; overflow: auto; padding: 12px; white-space: pre-wrap; }
.detail .btn { align-self: flex-start; }
.empty { padding: 20px; }
@media (max-width: 760px) { .row { grid-template-columns: 48px minmax(0, 1fr); } .nums { grid-column: 2; text-align: left; } .detail { padding-left: 20px; } }
</style>

<script setup lang="ts">
// Database backups. Platform admins only (the API answers 404 to anyone else).
definePageMeta({ middleware: 'auth' })
const { me } = useMe()
if (me.value && !me.value.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
useHead({ title: 'Backups · Slate admin' })

interface BackupInfo { key: string, size: number, rows: number, createdAt: string }
const { data: backups, refresh } = await useAsyncData('admin-backups', () => useRequestFetch()<BackupInfo[]>('/api/admin/backups'))
const table = useDataTable(() => backups.value ?? [], {
    sorters: { when: b => b.createdAt, rows: b => b.rows, size: b => b.size },
    initialSort: { key: 'when', dir: 'desc' }
})
const busy = ref(false)
const error = ref('')
async function backUpNow() {
    busy.value = true
    error.value = ''
    try {
        await $fetch('/api/admin/backups', { method: 'POST' })
        await refresh()
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'The backup didn’t work. Check Errors for details.'
    } finally {
        busy.value = false
    }
}
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const size = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`
</script>

<template>
    <div class="admin">
        <AdminHeader />
        <main class="wrap">
            <div class="head">
                <div>
                    <h1>Backups</h1>
                    <p class="muted">A full copy of the database is saved every Monday and Thursday at 2am, and the newest 8 are kept (about four weeks). Pictures and files are already stored safely and aren’t copied again. To restore one, see “Restore a backup” in the README.</p>
                </div>
                <button class="btn btn-dark" type="button" :disabled="busy" @click="backUpNow">{{ busy ? 'Backing up…' : 'Back up now' }}</button>
            </div>
            <p v-if="error" class="error-box" role="alert">{{ error }}</p>
            <section class="panel">
                <table class="tbl">
                    <thead><tr><SortTh :table="table" col="when" label="When" /><SortTh :table="table" col="rows" label="Rows" /><SortTh :table="table" col="size" label="Size" /><th scope="col"><span class="visually-hidden">Download</span></th></tr></thead>
                    <tbody>
                        <tr v-for="b in table.rows" :key="b.key">
                            <td>{{ when(b.createdAt) }}</td>
                            <td>{{ b.rows.toLocaleString('en-GB') }}</td>
                            <td>{{ size(b.size) }}</td>
                            <td class="actions"><a class="btn btn-ghost btn-sm" :href="`/api/admin/backups/${b.key}`" download>Download</a></td>
                        </tr>
                        <tr v-if="!backups?.length"><td colspan="4" class="muted">No backups yet. The first runs on Monday or Thursday at 2am, or press Back up now.</td></tr>
                    </tbody>
                </table>
                <TablePager :table="table" noun="backups" />
            </section>
            <p class="muted small">Backups hold everyone’s account details, so keep downloaded copies somewhere private.</p>
        </main>
    </div>
</template>

<style scoped>
.admin { background: var(--paper); min-height: 100vh; }
.wrap { display: flex; flex-direction: column; gap: 20px; margin: 0 auto; max-width: 1200px; padding: 28px 24px 56px; }
.head { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
.head p { margin: 6px 0 0; max-width: 70ch; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
.actions { text-align: right; }
.small { font-size: 13px; }
</style>

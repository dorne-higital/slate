<script setup lang="ts">
// Platform admin: every site on Slate. The API refuses anyone who isn't a platform admin.
definePageMeta({ middleware: 'auth' })
const { me, signOut } = useMe()
if (!me.value?.isPlatformAdmin) await navigateTo(me.value?.sites[0] ? `/sites/${me.value.sites[0].id}` : '/')

interface AdminSite {
    id: string
    name: string
    slug: string
    address: string
    ownerName: string | null
    ownerEmail: string | null
    pageCount: number
    createdAt: string
}

const fetcher = useRequestFetch()
const { data } = await useAsyncData('admin-sites', () => fetcher<{ totals: { sites: number, users: number }, sites: AdminSite[] }>('/api/admin/sites'))
useHead({ title: 'All sites · Slate' })

const search = ref('')
const shown = computed(() => {
    const q = search.value.trim().toLowerCase()
    return (data.value?.sites ?? []).filter(s => !q || [s.name, s.address, s.ownerName ?? '', s.ownerEmail ?? ''].some(v => v.toLowerCase().includes(q)))
})
const linkFor = (address: string) => `${address.includes('localhost') ? 'http' : 'https'}://${address}`
</script>

<template>
    <div class="admin">
        <header class="top">
            <NuxtLink to="/" aria-label="Slate home" class="home-link"><BrandMark :size="22" /></NuxtLink>
            <span class="tag">Platform admin</span>
            <span class="spacer" />
            <span class="who">{{ me?.name }}</span>
            <button type="button" class="btn btn-ghost btn-sm" @click="signOut">Log out</button>
        </header>

        <main class="wrap">
            <div class="head">
                <h1>All sites</h1>
                <p class="muted big">{{ data?.totals.sites ?? 0 }} sites, {{ data?.totals.users ?? 0 }} people. You can open and edit any of them.</p>
            </div>

            <label class="search">
                <span class="visually-hidden">Search sites</span>
                <input v-model="search" class="inp" type="search" placeholder="Search by site, address or owner">
            </label>

            <section class="panel scroll" aria-label="All sites">
                <table class="tbl">
                    <thead><tr><th scope="col">Site</th><th scope="col">Owner</th><th scope="col">Pages</th><th scope="col">Created</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
                    <tbody>
                        <tr v-for="s in shown" :key="s.id">
                            <td>
                                <span class="site">
                                    <span class="badge" aria-hidden="true">{{ s.name[0] }}</span>
                                    <span class="site-text">
                                        <NuxtLink class="rl" :to="`/sites/${s.id}`">{{ s.name }}</NuxtLink>
                                        <a class="muted" :href="linkFor(s.address)" target="_blank" rel="noopener">{{ s.address }}</a>
                                    </span>
                                </span>
                            </td>
                            <td><span class="site-text"><span>{{ s.ownerName ?? 'No owner' }}</span><span class="muted">{{ s.ownerEmail }}</span></span></td>
                            <td>{{ s.pageCount }}</td>
                            <td class="muted">{{ formatWhen(s.createdAt) }}</td>
                            <td class="actions"><NuxtLink class="btn btn-dark btn-sm" :to="`/sites/${s.id}`">Open</NuxtLink></td>
                        </tr>
                        <tr v-if="!shown.length"><td colspan="5" class="muted">No sites match.</td></tr>
                    </tbody>
                </table>
            </section>
        </main>
    </div>
</template>

<style scoped>
.top { align-items: center; background: var(--white); border-bottom: 1px solid var(--line); display: flex; gap: 14px; padding: 14px 24px; }
.home-link { text-decoration: none; }
.tag { background: var(--lichen); border-radius: 999px; color: var(--quarry); font-size: 12px; font-weight: 700; padding: 3px 10px; }
.spacer { flex: 1; }
.who { color: var(--text-muted); font-size: 14px; }
.wrap { display: flex; flex-direction: column; gap: 20px; margin: 0 auto; max-width: 1200px; padding: 32px 24px 56px; }
.head { display: flex; flex-direction: column; gap: 6px; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
.big { font-size: 15px; margin: 0; }
.search { max-width: 420px; }
.scroll { overflow-x: auto; }
.site { align-items: center; display: flex; gap: 12px; }
.badge { align-items: center; background: var(--heather); border-radius: var(--radius); color: var(--white); display: flex; flex: none; font-weight: 800; height: 34px; justify-content: center; width: 34px; }
.site-text { display: flex; flex-direction: column; gap: 2px; }
.rl { color: var(--quarry); font-weight: 700; text-decoration: none; }
.rl:hover { text-decoration: underline; }
.actions { text-align: right; }
</style>

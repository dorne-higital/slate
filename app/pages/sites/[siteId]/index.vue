<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()

const [{ data: site }, { data: pages }, { data: replies }] = await Promise.all([
    useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`)),
    useAsyncData(`pages-${siteId}`, () => fetcher<PageListItem[]>(`/api/sites/${siteId}/pages`)),
    useAsyncData(`recent-full-${siteId}`, () => fetcher<{ unread: number, latest: { id: string, formName: string, data: Record<string, string>, createdAt: string }[] }>(`/api/sites/${siteId}/replies/recent`))
])
interface Stats {
    pages: { total: number, published: number, drafts: number, changed: number }
    posts: { live: number, scheduled: number, drafts: number }
    forms: { forms: number, replies: number, toDo: number, last7: number }
    media: { files: number, bytes: number }
    people: { members: number, invites: number }
    domains: { connected: number, live: number }
    recent: { kind: 'page' | 'post', id: string, title: string, sub: string, updatedAt: string, by: string | null }[]
}
const { data: stats } = await useAsyncData(`stats-${siteId}`, () => fetcher<Stats>(`/api/sites/${siteId}/stats`))
// Built-in visitor stats (Cloudflare Web Analytics): loaded after the page, hidden until they're set up
interface Visitors { available: boolean, visits?: number, pageViews?: number, days?: { date: string, visits: number }[], pages?: { path: string, views: number }[] }
const { data: visitors } = useLazyAsyncData(`visitors-${siteId}`, () => $fetch<Visitors>(`/api/sites/${siteId}/visitors`).catch((): Visitors => ({ available: false })), { server: false })
const peak = computed(() => Math.max(1, ...(visitors.value?.days ?? []).map(d => d.visits)))
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const tiles = computed(() => {
    const s = stats.value
    if (!s) return []
    return [
        { label: 'Pages', value: s.pages.total, sub: s.pages.changed ? `${s.pages.changed} with unpublished changes` : `${s.pages.published} live · ${s.pages.drafts} ${s.pages.drafts === 1 ? 'draft' : 'drafts'}`, to: '/pages', warn: s.pages.changed > 0 },
        { label: 'Blog posts', value: s.posts.live, sub: [s.posts.scheduled && `${s.posts.scheduled} scheduled`, s.posts.drafts && plural(s.posts.drafts, 'draft')].filter(Boolean).join(' · ') || 'Live on your site', to: '/blog', warn: false },
        { label: 'Form replies', value: s.forms.replies, sub: s.forms.toDo ? `${s.forms.toDo} to deal with` : `${s.forms.last7} this week · ${plural(s.forms.forms, 'form')}`, to: '/forms', warn: s.forms.toDo > 0 },
        { label: 'Images and files', value: s.media.files, sub: formatBytes(s.media.bytes), to: '/media', warn: false },
        { label: 'People', value: s.people.members, sub: s.people.invites ? `${plural(s.people.invites, 'invite')} waiting` : 'Can edit this site', to: '/people', warn: false },
        { label: 'Domains', value: s.domains.connected, sub: s.domains.connected ? `${s.domains.live} live` : 'Using your free address', to: '/domains', warn: s.domains.connected > s.domains.live }
    ]
})
const replyName = (d: Record<string, string>) => Object.entries(d).find(([k]) => /name/i.test(k))?.[1] ?? Object.values(d)[0] ?? 'Someone'
const replyText = (d: Record<string, string>) => (Object.entries(d).find(([k]) => /message|details/i.test(k)) ?? Object.entries(d).at(-1))?.[1] ?? ''
useHead({ title: () => `Overview · ${site.value?.name ?? 'Slate'}` })

const home = computed(() => pages.value?.find(p => p.path === '/'))
const changed = computed(() => (pages.value ?? []).filter(p => p.hasUnpublishedChanges).length)
const liveUrl = computed(() => {
    if (!site.value) return '#'
    const host = site.value.liveAddress
    return `${host.startsWith('localhost') || host.includes('.localhost') ? 'http' : 'https'}://${host}`
})
</script>

<template>
    <div v-if="site" class="page">
        <div class="head">
            <h1>Overview</h1>
            <div class="row">
                <a class="btn btn-ghost" :href="liveUrl" target="_blank" rel="noopener">View site</a>
                <NuxtLink v-if="home" class="btn btn-dark" :to="`/sites/${siteId}/pages/${home.id}`">Edit home page</NuxtLink>
            </div>
        </div>

        <div class="live">
            <span class="dot" aria-hidden="true" />
            <span class="live-text">
                <b>Your site is live at {{ site.liveAddress }}</b>
                <span>{{ changed ? `${changed} page${changed === 1 ? ' has' : 's have'} changes that aren’t published yet.` : 'Everything is published.' }}</span>
            </span>
        </div>

        <ul class="tiles" aria-label="Your site at a glance">
            <li v-for="t in tiles" :key="t.label">
                <NuxtLink :to="`/sites/${siteId}${t.to}`" class="panel tile">
                    <span class="tile-label">{{ t.label }}</span>
                    <b class="tile-num">{{ t.value }}</b>
                    <span class="tile-sub" :class="{ warn: t.warn }">{{ t.sub }}</span>
                </NuxtLink>
            </li>
        </ul>

        <SiteHealth :site-id="siteId" />

        <section v-if="visitors?.available" class="panel visitors" aria-labelledby="vis-h">
            <div class="vis-head">
                <div>
                    <h2 id="vis-h">Visitors</h2>
                    <span class="muted">Last 30 days</span>
                </div>
                <div class="vis-nums">
                    <span><b>{{ visitors.visits?.toLocaleString('en-GB') }}</b> visits</span>
                    <span><b>{{ visitors.pageViews?.toLocaleString('en-GB') }}</b> page views</span>
                </div>
            </div>
            <div class="bars" role="img" :aria-label="`Visits per day over the last 30 days, ${visitors.visits} in total`">
                <span v-for="d in visitors.days" :key="d.date" class="bar" :style="{ height: `${Math.max(3, (d.visits / peak) * 100)}%` }" :title="`${dayLabel(d.date)}: ${d.visits} visits`" />
            </div>
            <ol v-if="visitors.pages?.length" class="top">
                <li v-for="p in visitors.pages" :key="p.path"><span>{{ p.path }}</span><b>{{ p.views.toLocaleString('en-GB') }}</b></li>
            </ol>
        </section>

        <div class="cols">
            <section class="panel" aria-labelledby="pages-h">
                <div class="ph">
                    <h2 id="pages-h">Recently edited</h2>
                    <NuxtLink :to="`/sites/${siteId}/pages`">All pages</NuxtLink>
                </div>
                <div class="scroll">
                    <table class="tbl">
                        <thead><tr><th scope="col">Page or post</th><th scope="col">Type</th><th scope="col">Edited</th><th scope="col">By</th></tr></thead>
                        <tbody>
                            <tr v-for="r in stats?.recent ?? []" :key="r.kind + r.id">
                                <td><span class="pg"><NuxtLink class="rl" :to="`/sites/${siteId}/${r.kind === 'page' ? 'pages' : 'blog'}/${r.id}`">{{ r.title }}</NuxtLink><span class="muted">{{ r.sub }}</span></span></td>
                                <td><span class="kind">{{ r.kind === 'page' ? 'Page' : 'Blog post' }}</span></td>
                                <td class="muted">{{ formatWhen(r.updatedAt) }}</td>
                                <td class="muted">{{ r.by?.split(' ')[0] ?? '' }}</td>
                            </tr>
                            <tr v-if="!stats?.recent.length"><td colspan="4" class="muted">Nothing edited yet.</td></tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <div class="side">
            <section class="panel replies" aria-labelledby="forms-h">
                <div class="ph">
                    <h2 id="forms-h">New form replies</h2>
                    <NuxtLink :to="`/sites/${siteId}/forms`">Open inbox</NuxtLink>
                </div>
                <NuxtLink v-for="r in replies?.latest ?? []" :key="r.id" :to="`/sites/${siteId}/forms`" class="reply">
                    <span class="reply-top"><b>{{ replyName(r.data) }}</b><span class="muted">{{ formatWhen(r.createdAt) }}</span></span>
                    <span class="muted">{{ r.formName }}</span>
                    <span class="reply-text">{{ replyText(r.data) }}</span>
                </NuxtLink>
                <p v-if="!replies?.latest.length" class="muted none">No replies yet. They’ll show here when someone fills in a form.</p>
            </section>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 28px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; font-weight: 700; margin: 0; }
.row { display: flex; flex-wrap: wrap; gap: 10px; }

.live { align-items: center; background: var(--quarry); border-radius: var(--radius-lg); color: var(--white); display: flex; flex-wrap: wrap; gap: 20px; padding: 20px 24px; }
.dot { background: #7fd1a8; border-radius: 50%; box-shadow: 0 0 0 4px rgb(127 209 168 / 25%); height: 12px; width: 12px; }
.live-text { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 240px; }
.live-text b { font-size: 17px; }
.live-text span { color: #c3c8d1; font-size: 14px; }

.tiles { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); list-style: none; margin: 0; padding: 0; }
.tile { color: var(--quarry); display: flex; flex-direction: column; gap: 4px; height: 100%; padding: 16px 18px; text-decoration: none; }
.tile:hover { box-shadow: 0 0 0 2px var(--quarry); }
.tile-label { color: var(--text-muted); font-size: 13px; font-weight: 700; }
.tile-num { font-size: 32px; font-weight: 800; letter-spacing: -.03em; line-height: 1.1; }
.tile-sub { color: var(--text-body); font-size: 13px; }
.tile-sub.warn { color: #9a5b00; font-weight: 600; }
.kind { background: var(--mist); border-radius: 999px; font-size: 12px; font-weight: 700; padding: 3px 9px; white-space: nowrap; }
.cols { display: grid; gap: 24px; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); align-items: start; }
.ph { align-items: center; display: flex; justify-content: space-between; padding: 18px 20px; }
.ph a { font-size: 14px; font-weight: 600; }
.scroll { overflow-x: auto; }
.pg { display: flex; flex-direction: column; gap: 2px; }
.rl { color: var(--quarry); font-weight: 600; text-decoration: none; }
.rl:hover { text-decoration: underline; }

.side { display: flex; flex-direction: column; gap: 24px; }
.reply { border-top: 1px solid var(--line-soft); color: var(--quarry); display: flex; flex-direction: column; gap: 4px; padding: 14px 20px; text-decoration: none; }
.reply:hover { background: #fafbfc; }
.reply-top { display: flex; gap: 12px; justify-content: space-between; }
.reply-text { color: var(--text-body); font-size: 14px; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.none { border-top: 1px solid var(--line-soft); margin: 0; padding: 14px 20px; }
.next { display: flex; flex-direction: column; gap: 14px; padding: 18px 20px; }
.next ul { display: flex; flex-direction: column; gap: 12px; list-style: none; margin: 0; padding: 0; }
.next li { align-items: flex-start; display: flex; gap: 12px; }
.next li > span:last-child { display: flex; flex-direction: column; gap: 2px; }
.ring { border: 2px solid var(--lichen); border-radius: 50%; flex: none; height: 20px; margin-top: 1px; width: 20px; }

@media (max-width: 1100px) { .cols { grid-template-columns: minmax(0, 1fr); } }
.visitors { display: flex; flex-direction: column; gap: 16px; padding: 18px 20px; }
.vis-head { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 12px 24px; justify-content: space-between; }
.vis-head h2 { font-size: 18px; margin: 0 0 2px; }
.vis-nums { display: flex; gap: 20px; }
.vis-nums b { font-size: 22px; letter-spacing: -.02em; }
.bars { align-items: flex-end; display: flex; gap: 3px; height: 90px; }
.bar { background: var(--quarry); border-radius: 3px 3px 0 0; flex: 1; min-width: 2px; opacity: .85; }
.bar:hover { opacity: 1; }
.top { display: flex; flex-direction: column; gap: 6px; list-style: none; margin: 0; padding: 0; }
.top li { border-top: 1px solid var(--line-soft); display: flex; font-size: 14px; gap: 12px; justify-content: space-between; padding-top: 6px; }
.top li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>

<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me } = useMe()

interface PostRow { id: string, title: string, coverImage: string, state: PostState, publishedAt: string | null, categoryName: string | null, authorName: string | null }
interface Category { id: string, name: string, slug: string, postCount: number }

const [{ data: posts }, { data: categories, refresh: refreshCats }, { data: site }] = await Promise.all([
    useAsyncData(`posts-${siteId}`, () => fetcher<PostRow[]>(`/api/sites/${siteId}/posts`)),
    useAsyncData(`cats-${siteId}`, () => fetcher<Category[]>(`/api/sites/${siteId}/categories`)),
    useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`))
])
useHead({ title: 'Blog · Slate' })

const canEdit = computed(() => ROLE_RANK[me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer'] >= ROLE_RANK.editor)
const filter = ref<'all' | PostState>('all')
const category = ref('')
const counts = computed(() => {
    const list = posts.value ?? []
    return { all: list.length, published: list.filter(p => p.state === 'published').length, scheduled: list.filter(p => p.state === 'scheduled').length, draft: list.filter(p => p.state === 'draft').length }
})
const table = useDataTable(() => posts.value ?? [], {
    sorters: { title: p => p.title, category: p => p.categoryName, state: p => p.state, date: p => p.publishedAt, author: p => p.authorName },
    search: p => `${p.title} ${p.categoryName ?? ''} ${p.authorName ?? ''}`,
    filter: () => (filter.value === 'all' && !category.value) ? null : p => (filter.value === 'all' || p.state === filter.value) && (!category.value || p.categoryName === category.value),
    initialSort: { key: 'date', dir: 'desc' }
})

const stateLook = {
    published: { label: 'Published', dot: '#5B5773', fg: '#2E3445' },
    scheduled: { label: 'Scheduled', dot: '#3B6FB6', fg: '#22477A' },
    draft: { label: 'Draft', dot: '#B2B8C3', fg: '#555C6E' }
} as const
const when = (p: PostRow) => {
    if (!p.publishedAt || p.state === 'draft') return 'Not published'
    const d = new Date(p.publishedAt)
    return p.state === 'scheduled'
        ? d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const creating = ref(false)
async function newPost() {
    creating.value = true
    try {
        const post = await $fetch<{ id: string }>(`/api/sites/${siteId}/posts`, { method: 'POST', body: { title: 'Untitled post' } })
        await navigateTo(`/sites/${siteId}/blog/${post.id}`)
    } finally {
        creating.value = false
    }
}

const newCat = ref('')
const addingCat = ref(false)
async function addCategory() {
    if (!newCat.value.trim()) return
    await $fetch(`/api/sites/${siteId}/categories`, { method: 'POST', body: { name: newCat.value } })
    newCat.value = ''
    addingCat.value = false
    await refreshCats()
}
async function removeCategory(id: string) {
    await $fetch(`/api/sites/${siteId}/categories/${id}`, { method: 'DELETE' })
    await refreshCats()
}
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Blog</h1>
            <button v-if="canEdit" class="btn btn-dark" type="button" :disabled="creating" @click="newPost">{{ creating ? 'Creating…' : 'New post' }}</button>
        </div>

        <div class="tools">
            <div class="seg" role="group" aria-label="Filter posts">
                <button v-for="f in ([['all', 'All'], ['published', 'Published'], ['scheduled', 'Scheduled'], ['draft', 'Drafts']] as const)" :key="f[0]" type="button" :class="{ on: filter === f[0] }" :aria-pressed="filter === f[0]" @click="filter = f[0]">
                    {{ f[1] }} {{ counts[f[0]] }}
                </button>
            </div>
            <label v-if="categories?.length" class="cat-filter">
                <span class="visually-hidden">Category</span>
                <select v-model="category" class="inp">
                    <option value="">All categories</option>
                    <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
                </select>
            </label>
            <label class="search">
                <span class="visually-hidden">Search posts</span>
                <input v-model="table.q" class="inp" type="search" placeholder="Search posts">
            </label>
        </div>

        <div class="two">
            <section class="panel scroll" aria-label="Posts">
                <table class="tbl">
                    <thead><tr><SortTh :table="table" col="title" label="Post" /><SortTh :table="table" col="category" label="Category" /><SortTh :table="table" col="state" label="Status" /><SortTh :table="table" col="date" label="Date" /><SortTh :table="table" col="author" label="Author" /></tr></thead>
                    <tbody>
                        <tr v-for="p in table.rows" :key="p.id">
                            <td>
                                <span class="post">
                                    <img v-if="p.coverImage" :src="p.coverImage" alt="" class="thumb">
                                    <span v-else class="thumb" aria-hidden="true" />
                                    <NuxtLink class="rl" :to="`/sites/${siteId}/blog/${p.id}`">{{ p.title }}</NuxtLink>
                                </span>
                            </td>
                            <td><span v-if="p.categoryName" class="tag">{{ p.categoryName }}</span></td>
                            <td><span class="pill" :style="{ color: stateLook[p.state].fg }"><i :style="{ background: stateLook[p.state].dot }" />{{ stateLook[p.state].label }}</span></td>
                            <td class="muted">{{ when(p) }}</td>
                            <td class="muted">{{ p.authorName?.split(' ')[0] }}</td>
                        </tr>
                        <tr v-if="!table.total"><td colspan="5" class="muted">{{ posts?.length ? 'No posts match.' : 'No posts yet. Press New post to write your first one.' }}</td></tr>
                    </tbody>
                </table>
                <TablePager :table="table" noun="posts" />
            </section>

            <section class="panel" aria-labelledby="cat-h">
                <div class="ph">
                    <h2 id="cat-h">Categories</h2>
                    <button v-if="canEdit && !addingCat" class="btn btn-ghost btn-sm" type="button" @click="addingCat = true">Add category</button>
                </div>
                <form v-if="addingCat" class="cat-add" @submit.prevent="addCategory">
                    <label class="visually-hidden" for="new-cat">Category name</label>
                    <input id="new-cat" v-model="newCat" class="inp" type="text" placeholder="e.g. Advice" maxlength="60">
                    <button class="btn btn-dark btn-sm" type="submit">Add</button>
                    <button class="btn btn-plain btn-sm" type="button" @click="addingCat = false">Cancel</button>
                </form>
                <ul class="cats">
                    <li v-for="c in categories" :key="c.id">
                        <b>{{ c.name }}</b>
                        <span class="cat-right">
                            <span class="muted">{{ c.postCount }} {{ c.postCount === 1 ? 'post' : 'posts' }}</span>
                            <button v-if="canEdit" class="x" type="button" :aria-label="`Remove category ${c.name}`" @click="removeCategory(c.id)">✕</button>
                        </span>
                    </li>
                    <li v-if="!categories?.length" class="muted">No categories yet.</li>
                </ul>
                <div class="where">
                    <b>Where your blog appears</b>
                    <span class="muted">Posts are listed at {{ site?.liveAddress }}/blog. Add a Latest posts block to show them on any page.</span>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
.tools { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
.seg { background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; height: 34px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }
.search { flex: 1 1 240px; max-width: 360px; }
.cat-filter .inp { font-size: 14px; height: 40px; min-width: 170px; }
.two { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); }
.scroll { overflow-x: auto; }
.post { align-items: center; display: flex; gap: 14px; }
.thumb { background: #dce4df; border-radius: 4px; flex: none; height: 44px; object-fit: cover; width: 64px; }
.rl { color: var(--quarry); font-weight: 600; text-decoration: none; }
.rl:hover { text-decoration: underline; }
.tag { background: var(--mist); border-radius: 999px; font-size: 12px; font-weight: 700; padding: 3px 9px; white-space: nowrap; }
.pill { align-items: center; display: inline-flex; font-size: 13px; font-weight: 600; gap: 7px; white-space: nowrap; }
.pill i { border-radius: 50%; display: block; height: 8px; width: 8px; }
.ph { align-items: center; display: flex; justify-content: space-between; padding: 16px 20px; }
.cat-add { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 20px 14px; }
.cat-add .inp { flex: 1 1 140px; font-size: 15px; height: 36px; }
.cats { list-style: none; margin: 0; padding: 0 0 8px; }
.cats li { align-items: center; border-top: 1px solid var(--line-soft); display: flex; justify-content: space-between; padding: 12px 20px; }
.cats b { font-weight: 600; }
.cat-right { align-items: center; display: flex; gap: 8px; }
.x { background: none; border: 0; border-radius: var(--radius); color: var(--text-muted); cursor: pointer; height: 28px; width: 28px; }
.x:hover { background: var(--mist); color: var(--danger); }
.where { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 6px; padding: 16px 20px; }
.where b { font-size: 14px; }
@media (max-width: 1100px) { .two { grid-template-columns: minmax(0, 1fr); } }
</style>

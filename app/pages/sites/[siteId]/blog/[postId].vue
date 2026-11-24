<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const postId = String(route.params.postId)
const fetcher = useRequestFetch()

interface EditorPost { id: string, title: string, slug: string, excerpt: string, coverImage: string, body: string, categoryId: string | null, status: PageStatus, publishedAt: string | null, state: PostState }

const [{ data: loaded, error }, { data: categories }, { data: site }] = await Promise.all([
    useAsyncData(`post-${postId}`, () => fetcher<EditorPost>(`/api/sites/${siteId}/posts/${postId}`)),
    useAsyncData(`cats-${siteId}`, () => fetcher<{ id: string, name: string }[]>(`/api/sites/${siteId}/categories`)),
    useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`))
])
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })

const post = reactive({ ...loaded.value! })
useHead({ title: () => `${post.title} · Blog · Slate` })

// Local date-time string for <input type="datetime-local">
const toLocalInput = (iso: string | null) => {
    const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 3600 * 1000)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const scheduleAt = ref(toLocalInput(post.state === 'scheduled' ? post.publishedAt : null))
const showSchedule = ref(false)

type SaveState = 'saved' | 'pending' | 'saving' | 'error'
const saveState = ref<SaveState>('saved')
let timer: ReturnType<typeof setTimeout> | undefined
function queueSave() {
    saveState.value = 'pending'
    clearTimeout(timer)
    timer = setTimeout(() => save(), 700)
}
async function save(extra: Record<string, unknown> = {}) {
    clearTimeout(timer)
    saveState.value = 'saving'
    try {
        const res = await $fetch<EditorPost>(`/api/sites/${siteId}/posts/${postId}`, {
            method: 'PATCH',
            body: { title: post.title, excerpt: post.excerpt, coverImage: post.coverImage, body: post.body, categoryId: post.categoryId, ...extra }
        })
        Object.assign(post, { slug: res.slug, status: res.status, publishedAt: res.publishedAt, state: res.state, coverImage: res.coverImage })
        saveState.value = 'saved'
    } catch {
        saveState.value = 'error'
    }
}

const publishNow = () => save({ status: 'published', publishedAt: post.state === 'scheduled' ? new Date().toISOString() : undefined })
const schedule = async () => {
    await save({ status: 'published', publishedAt: new Date(scheduleAt.value).toISOString() })
    showSchedule.value = false
}
const unpublish = () => save({ status: 'draft' })
const updateSlug = () => save({ slug: post.slug })

const deleting = ref(false)
const confirmDelete = ref(false)
async function remove() {
    deleting.value = true
    await $fetch(`/api/sites/${siteId}/posts/${postId}`, { method: 'DELETE' })
    await navigateTo(`/sites/${siteId}/blog`)
}

const statusText = computed(() => {
    if (saveState.value === 'error') return 'Couldn’t save. Check your connection; we’ll try again when you next type.'
    if (saveState.value !== 'saved') return 'Saving…'
    if (post.state === 'published') return 'Published. Changes go live as you type.'
    if (post.state === 'scheduled') return `Scheduled for ${new Date(post.publishedAt!).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.`
    return 'Draft saved. Not published yet.'
})
const liveUrl = computed(() => site.value ? `${site.value.liveAddress.includes('localhost') ? 'http' : 'https'}://${site.value.liveAddress}/blog/${post.slug}` : '#')

onBeforeRouteLeave(async () => {
    if (saveState.value === 'pending') await save()
})
</script>

<template>
    <div class="page">
        <div class="head">
            <div class="crumbs">
                <NuxtLink :to="`/sites/${siteId}/blog`">Blog</NuxtLink>
                <span aria-hidden="true">/</span>
                <span>{{ post.title }}</span>
            </div>
            <div class="row">
                <a v-if="post.state === 'published'" class="btn btn-ghost" :href="liveUrl" target="_blank" rel="noopener">View post</a>
                <button v-if="post.state !== 'draft'" class="btn btn-ghost" type="button" @click="unpublish">Move to drafts</button>
                <button v-if="post.state !== 'published'" class="btn btn-ghost" type="button" @click="showSchedule = !showSchedule">Schedule</button>
                <button v-if="post.state !== 'published'" class="btn btn-dark" type="button" @click="publishNow">Publish now</button>
            </div>
        </div>
        <p class="status" :class="{ err: saveState === 'error' }" aria-live="polite">{{ statusText }}</p>

        <form v-if="showSchedule" class="panel sched" @submit.prevent="schedule">
            <label for="sched-at">Publish on</label>
            <input id="sched-at" v-model="scheduleAt" class="inp" type="datetime-local" required>
            <button class="btn btn-dark btn-sm" type="submit">Schedule post</button>
            <span class="muted">It appears on your site automatically at that time.</span>
        </form>

        <div class="two">
            <section class="panel write" aria-label="Post">
                <label class="visually-hidden" for="p-title">Title</label>
                <input id="p-title" v-model="post.title" class="title-inp" type="text" placeholder="Post title" maxlength="160" @input="queueSave">
                <label class="visually-hidden" for="p-body">Post</label>
                <textarea id="p-body" v-model="post.body" class="body-inp" placeholder="Start writing…" @input="queueSave" />
                <p class="muted tips">Leave a blank line between paragraphs. Start a line with ## for a heading, or - for a list.</p>
            </section>

            <aside class="side">
                <section class="panel box">
                    <h2>Post settings</h2>
                    <div class="field">
                        <label for="p-cat">Category</label>
                        <select id="p-cat" v-model="post.categoryId" class="inp" @change="queueSave">
                            <option :value="null">None</option>
                            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                    </div>
                    <div class="field">
                        <label for="p-cover">Cover image</label>
                        <input id="p-cover" v-model="post.coverImage" class="inp" type="text" placeholder="https://…" @input="queueSave">
                        <img v-if="post.coverImage" :src="post.coverImage" alt="" class="cover-prev">
                        <MediaPicker :site-id="siteId" @pick="post.coverImage = $event.url; queueSave()" />
                        <span class="help">Also used when the post is shared.</span>
                    </div>
                    <div class="field">
                        <label for="p-excerpt">Summary</label>
                        <textarea id="p-excerpt" v-model="post.excerpt" class="inp" rows="3" maxlength="400" placeholder="Shown on the blog page and in search results" @input="queueSave" />
                    </div>
                    <div class="field">
                        <label for="p-slug">Address</label>
                        <div class="slug"><span class="muted">/blog/</span><input id="p-slug" v-model="post.slug" class="inp" type="text" @change="updateSlug"></div>
                    </div>
                </section>
                <div class="danger">
                    <button v-if="!confirmDelete" class="btn btn-plain del" type="button" @click="confirmDelete = true">Delete post</button>
                    <span v-else class="confirm">Delete this post for good?
                        <button class="btn btn-sm del-yes" type="button" :disabled="deleting" @click="remove">Yes, delete</button>
                        <button class="btn btn-plain btn-sm" type="button" @click="confirmDelete = false">Keep it</button>
                    </span>
                </div>
            </aside>
        </div>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
.crumbs { align-items: center; display: flex; font-size: 15px; gap: 8px; min-width: 0; }
.crumbs span:last-child { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.status { color: var(--text-muted); font-size: 14px; margin: 0; }
.status.err { color: var(--danger); }
.sched { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; padding: 14px 20px; }
.sched label { font-size: 14px; font-weight: 600; }
.sched .inp { font-size: 15px; height: 40px; width: auto; }
.two { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 1fr) 320px; }
.write { display: flex; flex-direction: column; gap: 12px; padding: 28px 32px; }
.title-inp { border: 0; color: var(--quarry); font-family: inherit; font-size: 34px; font-weight: 800; letter-spacing: -.03em; outline: none; padding: 0; width: 100%; }
.body-inp { border: 0; color: var(--text-body); font-family: inherit; font-size: 17px; line-height: 1.7; min-height: 480px; outline: none; padding: 0; resize: vertical; width: 100%; }
.tips { border-top: 1px solid var(--line-soft); margin: 0; padding-top: 12px; }
.side { display: flex; flex-direction: column; gap: 16px; }
.box { display: flex; flex-direction: column; gap: 16px; padding: 20px; }
h2 { font-size: 17px; margin: 0; }
.field label { font-size: 14px; }
.inp { font-size: 15px; height: 42px; }
textarea.inp { height: auto; line-height: 1.5; padding: 10px 12px; resize: vertical; }
.cover-prev { aspect-ratio: 16 / 10; border-radius: var(--radius); object-fit: cover; width: 100%; }
.slug { align-items: center; display: flex; gap: 4px; }
.danger { padding: 0 4px; }
.del { color: var(--danger); }
.confirm { align-items: center; color: var(--danger); display: flex; flex-wrap: wrap; font-size: 14px; gap: 8px; }
.del-yes { background: var(--danger); color: var(--white); }
@media (max-width: 1000px) { .two { grid-template-columns: minmax(0, 1fr); } }
</style>

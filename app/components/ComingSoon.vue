<script setup lang="ts">
useHead({
    title: 'Slate: websites for UK businesses, coming soon',
    meta: [{ name: 'description', content: 'Slate is a website builder for UK businesses: a page editor, forms, a blog and hosting in one account. Leave your email and we’ll tell you when it opens.' }]
})
const { me } = useMe()
const form = reactive({ email: '', name: '', business: '', website: '' })
const token = ref('')
const turnstile = ref<{ reset: () => void, token: () => Promise<string> } | null>(null)
const state = ref<'idle' | 'sending' | 'done'>('idle')
const error = ref('')
async function send() {
    state.value = 'sending'
    error.value = ''
    try {
        await $fetch('/api/public/interest', { method: 'POST', body: { ...form, turnstile: await turnstile.value?.token() ?? token.value } })
        state.value = 'done'
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'That didn’t send. Check your connection and try again.'
        state.value = 'idle'
        turnstile.value?.reset()
    }
}
const points = [
    { title: 'Build it yourself', text: 'Start from a layout and change anything by moving blocks around. No code.' },
    { title: 'Everything in one place', text: 'Pages, forms, a blog, your domain and hosting, in one account.' },
    { title: 'Made for UK businesses', text: 'Plain prices in pounds, UK support, and your data kept in London.' }
]
</script>

<template>
    <div class="cs">
        <header class="wrap bar">
            <BrandMark />
            <NuxtLink v-if="me" class="btn btn-ghost" :to="me.isPlatformAdmin ? '/?full=1' : '/sites'">{{ me.isPlatformAdmin ? 'See the full home page' : 'Your sites' }}</NuxtLink>
            <NuxtLink v-else class="link" to="/login">Log in</NuxtLink>
        </header>

        <main class="wrap main">
            <section class="hero">
                <p class="eyebrow">Coming soon</p>
                <h1>Your business website, without the faff.</h1>
                <p class="lead">Slate is a website builder for UK businesses. Build your site from ready-made blocks, take enquiries, write a blog and connect your own domain, all from one place.</p>
                <ul class="points">
                    <li v-for="p in points" :key="p.title"><b>{{ p.title }}</b><span>{{ p.text }}</span></li>
                </ul>
            </section>

            <section class="card" aria-labelledby="ri-h">
                <template v-if="state !== 'done'">
                    <h2 id="ri-h">Be the first to know</h2>
                    <p class="muted">Leave your email and we’ll let you know when Slate opens. Early sign-ups get a launch discount.</p>
                    <form class="form" @submit.prevent="send">
                        <div class="field"><label for="ri-email">Email</label><input id="ri-email" v-model="form.email" class="inp" type="email" autocomplete="email" required maxlength="200"></div>
                        <div class="field"><label for="ri-name">Your name <span class="muted">(optional)</span></label><input id="ri-name" v-model="form.name" class="inp" type="text" autocomplete="name" maxlength="120"></div>
                        <div class="field"><label for="ri-biz">Business <span class="muted">(optional)</span></label><input id="ri-biz" v-model="form.business" class="inp" type="text" autocomplete="organization" maxlength="160" placeholder="e.g. Smith & Sons Plumbing"></div>
                        <input v-model="form.website" class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
                        <TurnstileWidget ref="turnstile" @token="token = $event" />
                        <p v-if="error" class="error-box" role="alert">{{ error }}</p>
                        <button class="btn btn-lichen btn-lg" type="submit" :disabled="state === 'sending'">{{ state === 'sending' ? 'Sending…' : 'Keep me posted' }}</button>
                        <p class="small muted">We’ll only email you about Slate opening. See our <NuxtLink to="/privacy">privacy policy</NuxtLink>.</p>
                    </form>
                </template>
                <div v-else class="done" role="status">
                    <h2>You’re on the list</h2>
                    <p class="muted">Thanks. We’ll email {{ form.email }} as soon as Slate opens.</p>
                </div>
            </section>
        </main>

        <footer class="wrap foot">
            <span>© {{ new Date().getFullYear() }} Slate. Made in the UK.</span>
            <span><NuxtLink to="/privacy">Privacy</NuxtLink> · <NuxtLink to="/terms">Terms</NuxtLink> · <a href="mailto:hello@slatecms.co.uk">hello@slatecms.co.uk</a></span>
        </footer>
    </div>
</template>

<style scoped>
.cs { background: var(--paper); display: flex; flex-direction: column; min-height: 100vh; }
.wrap { margin: 0 auto; max-width: 1120px; padding: 0 40px; width: 100%; }
.bar { align-items: center; display: flex; justify-content: space-between; padding-bottom: 20px; padding-top: 20px; }
.link { color: var(--quarry); font-weight: 600; text-decoration: none; }
.link:hover { text-decoration: underline; }
.main { align-items: center; display: grid; flex: 1; gap: 64px; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); padding-bottom: 64px; padding-top: 48px; }
.eyebrow { color: var(--lichen-edge); font-size: 14px; font-weight: 800; letter-spacing: .08em; margin: 0 0 16px; text-transform: uppercase; }
h1 { color: var(--quarry); font-size: clamp(40px, 6vw, 68px); font-weight: 900; letter-spacing: -.04em; line-height: 1; margin: 0; }
.lead { color: var(--text-body); font-size: 19px; line-height: 1.6; margin: 24px 0 0; max-width: 34em; }
.points { display: flex; flex-direction: column; gap: 14px; list-style: none; margin: 32px 0 0; padding: 0; }
.points li { border-left: 3px solid var(--lichen); display: flex; flex-direction: column; gap: 2px; padding-left: 14px; }
.points b { color: var(--quarry); }
.points span { color: var(--text-body); font-size: 15px; }
.card { background: var(--white); border-radius: var(--radius-lg); box-shadow: 0 0 0 1px var(--line), 0 24px 48px -24px rgb(46 52 69 / 25%); padding: 32px; }
.card h2 { color: var(--quarry); font-size: 24px; letter-spacing: -.02em; margin: 0 0 8px; }
.form { display: flex; flex-direction: column; gap: 14px; margin-top: 20px; }
.inp { font-size: 16px; }
.hp { height: 1px; left: -9999px; opacity: 0; position: absolute; width: 1px; }
.small { font-size: 13px; margin: 0; }
.done { padding: 16px 0; }
.foot { border-top: 1px solid var(--line-soft); color: var(--text-muted); display: flex; flex-wrap: wrap; font-size: 14px; gap: 12px; justify-content: space-between; padding-bottom: 28px; padding-top: 20px; }
.foot a { color: inherit; }
@media (max-width: 860px) {
    .wrap { padding: 0 20px; }
    .main { gap: 40px; grid-template-columns: minmax(0, 1fr); padding-top: 24px; }
    .card { padding: 22px; }
}
</style>

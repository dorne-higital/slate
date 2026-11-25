<script setup lang="ts">
const { sitesDomain } = useRuntimeConfig().public
const { refresh } = useMe()

const route = useRoute()
// Joining someone's site from an invitation link: account only, no layout step
const inviteToken = typeof route.query.invite === 'string' ? route.query.invite : ''
const { comingSoon } = useRuntimeConfig().public
// A private sign-up link from Admin → Dashboard opens the form before launch
const signupKey = typeof route.query.key === 'string' ? route.query.key : ''
const { data: keyOpen } = await useAsyncData('signup-open', () => comingSoon && signupKey
    ? useRequestFetch()<{ open: boolean }>('/api/public/signup-open', { query: { key: signupKey } }).then(r => r.open).catch(() => false)
    : Promise.resolve(false))
const { data: invite } = await useAsyncData('signup-invite', () => inviteToken
    ? useRequestFetch()<{ siteName: string, role: SiteRole }>(`/api/invites/${inviteToken}`).catch(() => null)
    : Promise.resolve(null))

const turnstileToken = ref('')
const turnstile = ref<{ reset: () => void } | null>(null)
const step = ref<1 | 2 | 3>(1)
// After the site exists: optional domain step
const createdSiteId = ref<string | null>(null)
const freeAddress = ref('')
// Before launch only people with a working invitation or private link can make an account
const closed = computed(() => comingSoon && !invite.value && !keyOpen.value)
useHead(() => ({ title: closed.value ? 'Coming soon · Slate' : 'Start your site · Slate' }))
const form = reactive({ name: '', email: '', password: '', siteName: '', layout: 'trade', country: 'GB' })
const outsideUk = computed(() => form.country === 'other')
const error = ref('')
const busy = ref(false)

const slug = computed(() => slugify(form.siteName) || 'yoursite')
const current = computed(() => findStarterLayout(form.layout))

function next() {
    error.value = ''
    if (form.password.length < 10) {
        error.value = 'Your password needs at least 10 characters.'
        return
    }
    if (inviteToken) return create()
    step.value = 2
}

async function create() {
    busy.value = true
    error.value = ''
    try {
        const { siteId, slug } = await $fetch('/api/signup', { method: 'POST', body: { ...form, ...(inviteToken ? { invite: inviteToken } : {}), ...(signupKey ? { key: signupKey } : {}), turnstile: turnstileToken.value } })
        await refresh()
        if (inviteToken || !slug) return await navigateTo(`/sites/${siteId}`)
        createdSiteId.value = siteId
        freeAddress.value = `${slug}.${useRuntimeConfig().public.sitesDomain}`
        step.value = 3
    } catch (err) {
        error.value = (err as { statusMessage?: string, data?: { statusMessage?: string } }).data?.statusMessage
            ?? 'Something went wrong. Please try again.'
        step.value = 1
        turnstile.value?.reset()
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="su">
        <div class="left">
            <NuxtLink to="/" aria-label="Slate home" class="home-link"><BrandMark /></NuxtLink>

            <div v-if="closed" class="stack">
                <div class="intro">
                    <h1>We’re not open yet</h1>
                    <p>{{ inviteToken ? 'This invitation has expired or has already been used. Ask whoever invited you for a new link.' : signupKey ? 'This sign-up link has expired. Ask for a new one, or leave your email and we’ll tell you when Slate opens.' : 'Slate opens for sign-ups soon. Leave your email and we’ll tell you as soon as it does.' }}</p>
                </div>
                <NuxtLink class="btn btn-lichen btn-lg" to="/">Register your interest</NuxtLink>
                <p class="small">Already have an account? <NuxtLink to="/login">Log in</NuxtLink></p>
            </div>

            <ol v-if="!inviteToken && !closed" aria-label="Sign-up steps" class="steps">
                <li :class="step === 1 ? 'on' : 'done'"><span>1</span>Your account</li>
                <li class="bar" aria-hidden="true" />
                <li :class="step === 2 ? 'on' : step === 3 ? 'done' : ''"><span>2</span>Starting layout</li>
                <li class="bar" aria-hidden="true" />
                <li :class="step === 3 ? 'on' : ''"><span>3</span>Your domain</li>
            </ol>

            <form v-if="step === 1 && !closed" class="stack" @submit.prevent="next">
                <div class="intro">
                    <h1>{{ invite ? `Join ${invite.siteName}` : 'Start your site' }}</h1>
                    <p>{{ invite ? `Make your Slate account to start working on ${invite.siteName}.` : inviteToken ? 'This invitation has expired or has already been used. Ask for a new link, or start your own site below.' : 'Free to start. No card needed.' }}</p>
                </div>
                <p v-if="error" class="error-box" role="alert">{{ error }}</p>
                <div class="field"><label for="su-name">Your name</label><input id="su-name" v-model="form.name" class="inp" type="text" autocomplete="name" required></div>
                <div class="field"><label for="su-email">Email</label><input id="su-email" v-model="form.email" class="inp" type="email" autocomplete="email" required></div>
                <div class="field">
                    <label for="su-pass">Password</label>
                    <input id="su-pass" v-model="form.password" class="inp" type="password" autocomplete="new-password" required>
                    <span class="help">At least 10 characters.</span>
                </div>
                <div v-if="!invite" class="field">
                    <label for="su-site">What’s your business called?</label>
                    <input id="su-site" v-model="form.siteName" class="inp" type="text" :required="!invite">
                    <span class="help">Your free address: <b>{{ slug }}.{{ sitesDomain }}</b>. You can connect your own domain later.</span>
                </div>
                <p class="small">By creating an account you agree to our <NuxtLink to="/terms" target="_blank">terms</NuxtLink> and <NuxtLink to="/privacy" target="_blank">privacy policy</NuxtLink>.</p>
                <div v-if="!invite" class="field">
                    <label for="su-country">Where’s your business based?</label>
                    <select id="su-country" v-model="form.country" class="inp">
                        <option v-for="c in SELL_TO" :key="c.code" :value="c.code">{{ c.name }}</option>
                        <option value="other">Somewhere else</option>
                    </select>
                    <p v-if="outsideUk" class="error-box" role="alert">{{ NOT_SELLING_MESSAGE }}</p>
                </div>
                <button class="btn btn-lichen btn-lg" type="submit" :disabled="busy || (!invite && outsideUk)">{{ busy ? 'Creating your account…' : invite ? 'Create account and join' : 'Create account' }}</button>
                <p class="small">Already have an account? <NuxtLink to="/login">Log in</NuxtLink></p>
            </form>

            <div v-else-if="step === 3 && createdSiteId" class="stack wide">
                <div class="intro">
                    <h1>Want your own domain?</h1>
                    <p>Your site is ready at <b>{{ freeAddress }}</b>. A domain like yourbusiness.co.uk looks more professional. You can also do this later from Domains.</p>
                </div>
                <DomainBuy :site-id="createdSiteId" can-buy auto-search :suggestion="form.siteName" />
                <div class="row">
                    <NuxtLink class="btn btn-lichen btn-lg" :to="`/sites/${createdSiteId}`">Open the editor</NuxtLink>
                    <NuxtLink class="btn btn-plain" :to="`/sites/${createdSiteId}`">Skip for now</NuxtLink>
                </div>
            </div>

            <div v-else class="stack wide">
                <div class="intro">
                    <h1>Pick a starting layout</h1>
                    <p>Each one comes with the pages most businesses like yours need. You can change everything afterwards.</p>
                </div>
                <div role="radiogroup" aria-label="Starting layout" class="layouts">
                    <button
                        v-for="l in STARTER_LAYOUTS"
                        :key="l.id"
                        type="button"
                        role="radio"
                        :aria-checked="form.layout === l.id"
                        class="lay"
                        :class="{ on: form.layout === l.id }"
                        @click="form.layout = l.id"
                    >
                        <b>{{ l.name }}</b>
                        <span>{{ l.id === 'blank' ? 'One empty home page' : l.pages.join(', ') }}</span>
                    </button>
                </div>
                <div class="row">
                    <button class="btn btn-lichen btn-lg" type="button" :disabled="busy" @click="create">{{ busy ? 'Creating your site…' : 'Create my site' }}</button>
                    <button class="btn btn-plain" type="button" @click="step = 1">Back</button>
                </div>
            </div>
            <TurnstileWidget v-if="step !== 3 && !closed" ref="turnstile" @token="turnstileToken = $event" />
        </div>

        <div class="preview" aria-hidden="true">
            <div class="mock">
                <div class="sheet m-nav"><b>{{ form.siteName || 'Your business' }}</b><span><i /><i /><i class="on" /></span></div>
                <div class="sheet m-hero"><b>{{ current.hero }}</b><i class="line" /><i class="cta" /></div>
                <div v-for="p in current.pages.slice(1, 4)" :key="p" class="sheet m-row">{{ p }}</div>
            </div>
            <p>A preview of your site. It updates as you fill in the form.</p>
        </div>
    </div>
</template>

<style scoped>
.su { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: 100vh; }
.left { display: flex; flex-direction: column; gap: 48px; padding: 40px 64px 56px; }
.home-link { text-decoration: none; }

.steps { display: flex; flex-wrap: wrap; font-size: 14px; font-weight: 600; gap: 8px; list-style: none; margin: 0; padding: 0; }
.steps li { align-items: center; color: var(--text-muted); display: flex; gap: 8px; }
.steps li span { align-items: center; background: var(--mist); border-radius: 50%; display: flex; height: 26px; justify-content: center; width: 26px; }
.steps li.on, .steps li.done { color: var(--quarry); }
.steps li.on span { background: var(--quarry); color: var(--white); }
.steps li.done span { background: var(--heather); color: var(--white); }
.steps .bar { align-self: center; background: #c3c8d1; height: 2px; width: 32px; }

.stack { display: flex; flex-direction: column; gap: 22px; max-width: 460px; }
.stack.wide { max-width: 560px; }
.intro { display: flex; flex-direction: column; gap: 10px; margin-bottom: 6px; }
h1 { font-size: 44px; font-weight: 900; letter-spacing: -.04em; line-height: 1.02; margin: 0; }
.intro p { color: var(--text-body); font-size: 17px; line-height: 1.55; margin: 0; }
.small { color: var(--text-muted); font-size: 14px; margin: 0; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; }

.layouts { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.lay { background: var(--white); border: 1.5px solid #d4d8df; border-radius: var(--radius-lg); color: var(--quarry); cursor: pointer; display: flex; flex-direction: column; font-family: inherit; gap: 6px; padding: 18px; text-align: left; }
.lay:hover { border-color: var(--split); }
.lay.on { border-color: var(--quarry); box-shadow: 0 0 0 2px var(--quarry); }
.lay b { font-size: 17px; }
.lay span { color: var(--text-muted); font-size: 14px; line-height: 1.5; }

.preview { align-items: center; background: var(--mist); display: flex; flex-direction: column; gap: 36px; justify-content: center; overflow: hidden; padding: 56px; }
.preview p { color: var(--text-body); font-size: 15px; margin: 0; max-width: 30em; text-align: center; }
.mock { display: flex; flex-direction: column; gap: 14px; max-width: 520px; width: 100%; }
.m-nav { align-items: center; display: flex; height: 52px; justify-content: space-between; padding: 0 22px; }
.m-nav b { font-size: 15px; }
.m-nav span { display: flex; gap: 10px; }
.m-nav i { background: #c3c8d1; border-radius: 2px; display: block; height: 7px; width: 36px; }
.m-nav i.on { background: var(--heather); }
.m-hero { background: var(--paper); display: flex; flex-direction: column; gap: 14px; padding: 34px 26px; }
.m-hero b { font-size: 30px; letter-spacing: -.03em; line-height: 1.05; }
.m-hero .line { background: #d4d8df; border-radius: 2px; display: block; height: 8px; width: 72%; }
.m-hero .cta { background: var(--heather); border-radius: 4px; display: block; height: 34px; width: 118px; }
.m-row { align-items: center; color: var(--text-body); display: flex; font-size: 14px; font-weight: 600; height: 46px; padding: 0 22px; }

@media (max-width: 900px) {
    .su { grid-template-columns: minmax(0, 1fr); }
    .preview { display: none; }
    .left { padding: 24px 16px 40px; }
    .layouts { grid-template-columns: minmax(0, 1fr); }
}
</style>

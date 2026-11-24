<script setup lang="ts">
useHead({ title: 'Start your site · Slate' })
const { sitesDomain } = useRuntimeConfig().public
const { refresh } = useMe()

const step = ref<1 | 2>(1)
const form = reactive({ name: '', email: '', password: '', siteName: '', layout: 'trade' })
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
    step.value = 2
}

async function create() {
    busy.value = true
    error.value = ''
    try {
        const { siteId } = await $fetch('/api/signup', { method: 'POST', body: form })
        await refresh()
        await navigateTo(`/sites/${siteId}`)
    } catch (err) {
        error.value = (err as { statusMessage?: string, data?: { statusMessage?: string } }).data?.statusMessage
            ?? 'Something went wrong. Please try again.'
        step.value = 1
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="su">
        <div class="left">
            <NuxtLink to="/" aria-label="Slate home" class="home-link"><BrandMark /></NuxtLink>

            <ol aria-label="Sign-up steps" class="steps">
                <li :class="step === 1 ? 'on' : 'done'"><span>1</span>Your account</li>
                <li class="bar" aria-hidden="true" />
                <li :class="step === 2 ? 'on' : ''"><span>2</span>Starting layout</li>
                <li class="bar" aria-hidden="true" />
                <li><span>3</span>Editor</li>
            </ol>

            <form v-if="step === 1" class="stack" @submit.prevent="next">
                <div class="intro">
                    <h1>Start your site</h1>
                    <p>Free to start. No card needed.</p>
                </div>
                <p v-if="error" class="error-box" role="alert">{{ error }}</p>
                <div class="field"><label for="su-name">Your name</label><input id="su-name" v-model="form.name" class="inp" type="text" autocomplete="name" required></div>
                <div class="field"><label for="su-email">Email</label><input id="su-email" v-model="form.email" class="inp" type="email" autocomplete="email" required></div>
                <div class="field">
                    <label for="su-pass">Password</label>
                    <input id="su-pass" v-model="form.password" class="inp" type="password" autocomplete="new-password" required>
                    <span class="help">At least 10 characters.</span>
                </div>
                <div class="field">
                    <label for="su-site">What’s your business called?</label>
                    <input id="su-site" v-model="form.siteName" class="inp" type="text" required>
                    <span class="help">Your free address: <b>{{ slug }}.{{ sitesDomain }}</b>. You can connect your own domain later.</span>
                </div>
                <button class="btn btn-lichen btn-lg" type="submit">Create account</button>
                <p class="small">Already have an account? <NuxtLink to="/login">Log in</NuxtLink></p>
            </form>

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
                    <button class="btn btn-lichen btn-lg" type="button" :disabled="busy" @click="create">{{ busy ? 'Creating your site…' : 'Open the editor' }}</button>
                    <button class="btn btn-plain" type="button" @click="step = 1">Back</button>
                </div>
            </div>
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

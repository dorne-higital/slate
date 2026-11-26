<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const page = useMarketingSeo('/contact', {
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'ContactPage', 'name': 'Contact Slate', 'url': `${MARKETING_SITE}/contact` }]
})
interface Field { id: string, label: string, kind: string, required: boolean, options: string[] }
const { data } = await useFetch<{ available: boolean, fields: Field[], submitLabel: string }>('/api/marketing/contact')
const answers = reactive<Record<string, string>>({})
const website = ref('')
const startedAt = ref(0)
onMounted(() => {
    startedAt.value = Date.now()
})
const turnstile = ref<{ reset: () => void, token: () => Promise<string> } | null>(null)
const token = ref('')
const sending = ref(false)
const done = ref('')
const error = ref('')
const badField = ref('')

async function send() {
    sending.value = true
    error.value = ''
    badField.value = ''
    try {
        const r = await $fetch<{ message: string }>('/api/marketing/contact', {
            method: 'POST',
            body: { answers, website: website.value, startedAt: startedAt.value, turnstile: await turnstile.value?.token() ?? token.value }
        })
        done.value = r.message
    } catch (e: unknown) {
        const err = e as { data?: { statusMessage?: string, data?: { fieldId?: string } } }
        error.value = err.data?.statusMessage ?? 'That didn’t send. Please try again, or email hello@slatecms.co.uk.'
        badField.value = err.data?.data?.fieldId ?? ''
        turnstile.value?.reset()
    } finally {
        sending.value = false
    }
}
</script>

<template>
    <div class="mk-wrap wrap">
        <section class="intro">
            <p class="eyebrow">Contact</p>
            <h1>{{ page.h1 }}</h1>
            <p class="lead">Questions about Slate, moving your website, or building sites for clients? Send a message and you’ll hear back from a real person, usually within a working day.</p>
            <dl class="ways">
                <div><dt>Email</dt><dd><a :href="`mailto:${LEGAL.email}`">{{ LEGAL.email }}</a></dd></div>
                <div><dt>Already using Slate?</dt><dd>Use <b>Support</b> in your dashboard, so we can see which site you mean.</dd></div>
                <div><dt>Based in</dt><dd>{{ LEGAL.location }}</dd></div>
            </dl>
        </section>

        <section class="panel card" aria-labelledby="form-h">
            <h2 id="form-h">Send a message</h2>
            <p v-if="done" class="done" role="status">{{ done }}</p>
            <p v-else-if="!data?.available" class="muted">The form isn’t available right now. Please email <a :href="`mailto:${LEGAL.email}`">{{ LEGAL.email }}</a>.</p>
            <form v-else @submit.prevent="send">
                <div v-for="f in data.fields" :key="f.id" class="field">
                    <label :for="`f-${f.id}`">{{ f.label }}<span v-if="!f.required" class="opt"> (optional)</span></label>
                    <textarea v-if="f.kind === 'textarea'" :id="`f-${f.id}`" v-model="answers[f.id]" class="inp" rows="6" :required="f.required" :aria-invalid="badField === f.id" />
                    <select v-else-if="f.kind === 'select'" :id="`f-${f.id}`" v-model="answers[f.id]" class="inp" :required="f.required" :aria-invalid="badField === f.id">
                        <option value="">Choose…</option>
                        <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
                    </select>
                    <input v-else :id="`f-${f.id}`" v-model="answers[f.id]" class="inp" :type="f.kind === 'email' ? 'email' : f.kind === 'phone' ? 'tel' : 'text'" :autocomplete="f.kind === 'email' ? 'email' : f.kind === 'phone' ? 'tel' : f.label.toLowerCase() === 'name' ? 'name' : 'off'" :required="f.required" :aria-invalid="badField === f.id">
                </div>
                <div class="hp" aria-hidden="true"><label>Leave this empty <input v-model="website" tabindex="-1" autocomplete="off"></label></div>
                <TurnstileWidget ref="turnstile" @token="token = $event" />
                <p v-if="error" class="error-box" role="alert">{{ error }}</p>
                <button class="btn btn-lichen btn-xl" type="submit" :disabled="sending">{{ sending ? 'Sending…' : data.submitLabel }}</button>
                <p class="small">We’ll only use your details to reply. See our <NuxtLink to="/privacy">privacy policy</NuxtLink>.</p>
            </form>
        </section>
    </div>
</template>

<style scoped>
.wrap { display: grid; gap: 56px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); padding-bottom: 96px; padding-top: 64px; }
.intro { display: flex; flex-direction: column; gap: 18px; }
.eyebrow { color: var(--heather); font-size: 15px; font-weight: 700; letter-spacing: .04em; margin: 0; text-transform: uppercase; }
h1 { font-size: clamp(40px, 5.4vw, 64px); font-weight: 900; letter-spacing: -.045em; line-height: 1; margin: 0; }
.lead { color: var(--text-body); font-size: 20px; line-height: 1.55; margin: 0; }
.ways { display: flex; flex-direction: column; gap: 16px; margin: 16px 0 0; }
.ways dt { color: var(--text-muted); font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.ways dd { font-size: 17px; margin: 4px 0 0; }
.ways a { color: var(--heather); font-weight: 600; }
.card { align-self: start; display: flex; flex-direction: column; gap: 16px; padding: 28px; }
.card h2 { font-size: 24px; margin: 0; }
form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-weight: 600; }
.opt { color: var(--text-muted); font-weight: 400; }
.field textarea.inp { height: auto; min-height: 150px; padding-bottom: 10px; padding-top: 10px; resize: vertical; }
.hp { height: 1px; left: -9999px; overflow: hidden; position: absolute; width: 1px; }
.done { background: color-mix(in srgb, var(--ok) 14%, transparent); border-radius: var(--radius-lg); color: var(--ok-text); font-weight: 600; margin: 0; padding: 16px; }
.small { color: var(--text-muted); font-size: 14px; margin: 0; }
.small a { color: var(--heather); }
button { align-self: flex-start; }
@media (max-width: 900px) { .wrap { gap: 40px; grid-template-columns: minmax(0, 1fr); } }
</style>

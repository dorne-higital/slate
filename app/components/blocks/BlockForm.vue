<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, intro?: string, formId?: string }>()

// The page (public site or editor) provides the forms its blocks use, and whether this is a preview
const forms = inject<Ref<Record<string, FormDefinition>>>('siteForms', ref({}))
const preview = inject<boolean>('blockPreview', false)
const form = computed(() => (props.formId ? forms.value[props.formId] : undefined))

const answers = reactive<Record<string, string>>({})
// Dropdowns start on “Choose…” rather than blank
watchEffect(() => { for (const f of form.value?.fields ?? []) if (f.kind === 'select' && answers[f.id] === undefined) answers[f.id] = '' })
const website = ref('')
const startedAt = ref(0)
const state = ref<'idle' | 'sending' | 'sent'>('idle')
const error = ref('')
const errorField = ref<string | null>(null)
const thanks = ref('')
const route = useRoute()
const uid = useId()

onMounted(() => (startedAt.value = Date.now()))

// Steps: questions between step breaks. One step at a time; each step's answers are checked before moving on.
const steps = computed(() => form.value ? formSteps(form.value.fields) : [])
const step = ref(0)
const isLast = computed(() => step.value >= steps.value.length - 1)
const formEl = ref<HTMLFormElement | null>(null)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function checkStep(i: number) {
    for (const f of steps.value[i]?.fields ?? []) {
        const v = (answers[f.id] ?? '').trim()
        if (f.required && !v) return { fieldId: f.id, message: `Please fill in “${f.label}”.` }
        if (v && f.kind === 'email' && !EMAIL.test(v)) return { fieldId: f.id, message: 'That email address doesn’t look right.' }
    }
    return null
}
function focusField(id: string) {
    nextTick(() => document.getElementById(`${uid}-${id}`)?.focus())
}
function next() {
    const problem = checkStep(step.value)
    error.value = problem?.message ?? ''
    errorField.value = problem?.fieldId ?? null
    if (problem) return focusField(problem.fieldId)
    step.value++
    nextTick(() => formEl.value?.querySelector<HTMLElement>('input, textarea, select')?.focus())
}
function back() {
    error.value = ''
    errorField.value = null
    step.value = Math.max(0, step.value - 1)
}
function onSubmit() {
    if (!isLast.value) return next()
    const problem = checkStep(step.value)
    if (problem) {
        error.value = problem.message
        errorField.value = problem.fieldId
        return focusField(problem.fieldId)
    }
    submit()
}

async function submit() {
    if (preview || !form.value) return
    state.value = 'sending'
    error.value = ''
    errorField.value = null
    try {
        const res = await $fetch<{ message: string }>(`/api/public/forms/${form.value.id}`, {
            method: 'POST',
            body: { answers, website: website.value, startedAt: startedAt.value, page: route.path }
        })
        thanks.value = res.message
        state.value = 'sent'
    } catch (err) {
        const e = err as { data?: { statusMessage?: string, data?: { fieldId?: string } } }
        error.value = e.data?.statusMessage ?? 'Something went wrong sending the form. Please try again.'
        errorField.value = e.data?.data?.fieldId ?? null
        // Show the step the server's complaint is about
        const at = steps.value.findIndex(st => st.fields.some(f => f.id === errorField.value))
        if (at >= 0) step.value = at
        state.value = 'idle'
    }
}
</script>

<template>
    <section class="blk">
        <div class="blk-inner narrow">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <p v-if="intro" class="blk-muted">{{ intro }}</p>

            <div v-if="!form" class="missing">
                {{ preview ? 'Pick a form for this block in the settings on the right.' : '' }}
            </div>

            <div v-else-if="state === 'sent'" class="sent" role="status">
                <b>Sent</b>
                <p>{{ thanks }}</p>
            </div>

            <form v-else ref="formEl" class="frm" novalidate @submit.prevent="onSubmit">
                <div v-if="steps.length > 1" class="progress">
                    <span class="progress-text">Step {{ step + 1 }} of {{ steps.length }}<template v-if="steps[step]?.title"> · <b>{{ steps[step]!.title }}</b></template></span>
                    <span class="bar" aria-hidden="true"><i :style="{ width: `${((step + 1) / steps.length) * 100}%` }" /></span>
                </div>
                <div v-for="f in steps[step]?.fields ?? []" :key="f.id" class="fld">
                    <label :for="`${uid}-${f.id}`">{{ f.label }}<span v-if="!f.required" class="opt"> (optional)</span></label>
                    <textarea v-if="f.kind === 'textarea'" :id="`${uid}-${f.id}`" v-model="answers[f.id]" rows="5" :required="f.required" :aria-invalid="errorField === f.id" />
                    <select v-else-if="f.kind === 'select'" :id="`${uid}-${f.id}`" v-model="answers[f.id]" :required="f.required" :aria-invalid="errorField === f.id">
                        <option value="">Choose…</option>
                        <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
                    </select>
                    <input
                        v-else
                        :id="`${uid}-${f.id}`"
                        v-model="answers[f.id]"
                        :type="f.kind === 'email' ? 'email' : f.kind === 'phone' ? 'tel' : 'text'"
                        :autocomplete="f.kind === 'email' ? 'email' : f.kind === 'phone' ? 'tel' : undefined"
                        :required="f.required"
                        :aria-invalid="errorField === f.id"
                    >
                </div>
                <!-- Left empty by people; bots fill it in -->
                <div class="hp" aria-hidden="true">
                    <label :for="`${uid}-website`">Website</label>
                    <input :id="`${uid}-website`" v-model="website" type="text" tabindex="-1" autocomplete="off">
                </div>
                <p v-if="error" class="err" role="alert">{{ error }}</p>
                <div class="actions">
                    <button v-if="step > 0" class="blk-btn outline" type="button" @click="back">Back</button>
                    <button class="blk-btn" type="submit" :disabled="state === 'sending' || (preview && isLast)">{{ !isLast ? 'Next' : state === 'sending' ? 'Sending…' : form.submitLabel }}</button>
                </div>
            </form>
        </div>
    </section>
</template>

<style scoped>
.narrow { max-width: 720px; }
.frm { display: flex; flex-direction: column; gap: 18px; }
.fld { display: flex; flex-direction: column; gap: 8px; }
.fld label { color: var(--site-heading); font-size: 15px; font-weight: 600; }
.opt { color: var(--site-muted); font-weight: 400; }
.fld input, .fld textarea, .fld select {
    background: var(--site-bg);
    border: 1.5px solid color-mix(in srgb, var(--site-text) 35%, transparent);
    border-radius: min(var(--site-radius), 8px);
    color: var(--site-text);
    font: inherit;
    font-size: 16px;
    padding: 12px 14px;
    width: 100%;
}
.fld input:focus, .fld textarea:focus, .fld select:focus { border-color: var(--site-primary); outline: 2px solid color-mix(in srgb, var(--site-primary) 30%, transparent); }
.fld [aria-invalid="true"] { border-color: #a3261b; }
.fld textarea { resize: vertical; }
.hp { height: 1px; left: -10000px; overflow: hidden; position: absolute; width: 1px; }
.err { color: #a3261b; font-size: 15px; }
.progress { display: flex; flex-direction: column; gap: 8px; }
.progress-text { color: var(--site-muted); font-size: 14px; }
.progress-text b { color: var(--site-heading); }
.bar { background: color-mix(in srgb, var(--site-text) 12%, transparent); border-radius: 999px; display: block; height: 6px; overflow: hidden; }
.bar i { background: var(--site-primary); border-radius: 999px; display: block; height: 100%; transition: width .3s; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; }
.blk-btn { border: 0; cursor: pointer; font: inherit; font-weight: 700; }
.blk-btn:disabled { cursor: default; opacity: .7; }
.sent { background: var(--site-surface); border-radius: var(--site-card-radius); display: flex; flex-direction: column; gap: 6px; padding: 24px; }
.sent b { font-size: 19px; }
.missing:empty { display: none; }
.missing { background: var(--site-surface); border: 2px dashed color-mix(in srgb, var(--site-text) 25%, transparent); border-radius: 8px; color: var(--site-muted); padding: 24px; text-align: center; }
</style>

<script setup lang="ts">
// Edit a form's questions, button and thank-you message. Emits the saved form.
const props = defineProps<{ siteId: string, form: FormDefinition, canDelete: boolean }>()
const emit = defineEmits<{ saved: [FormDefinition], deleted: [], close: [] }>()

const draft = reactive(structuredClone(toRaw(props.form)))
const busy = ref<'save' | 'delete' | null>(null)
const error = ref('')
const confirmDelete = ref(false)

function addField() {
    draft.fields.push({ id: crypto.randomUUID(), label: '', kind: 'text', required: false })
}
function move(i: number, dir: -1 | 1) {
    const [f] = draft.fields.splice(i, 1)
    draft.fields.splice(i + dir, 0, f!)
}
function optionsText(f: FormField) {
    return (f.options ?? []).join('\n')
}
function setOptions(f: FormField, text: string) {
    f.options = text.split('\n').map(s => s.trim()).filter(Boolean)
}

async function save() {
    busy.value = 'save'
    error.value = ''
    try {
        const saved = await $fetch<FormDefinition>(`/api/sites/${props.siteId}/forms/${props.form.id}`, { method: 'PUT', body: draft })
        emit('saved', saved)
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t save the form. Please try again.'
    } finally {
        busy.value = null
    }
}

async function remove() {
    busy.value = 'delete'
    try {
        await $fetch(`/api/sites/${props.siteId}/forms/${props.form.id}`, { method: 'DELETE' })
        emit('deleted')
    } catch {
        error.value = 'Couldn’t delete the form. You may need to be a site admin.'
    } finally {
        busy.value = null
    }
}
</script>

<template>
    <section class="panel fe" aria-labelledby="fe-h">
        <div class="fe-head">
            <h2 id="fe-h">Edit form</h2>
            <button class="btn btn-plain" type="button" @click="emit('close')">Back to replies</button>
        </div>

        <p v-if="error" class="error-box" role="alert">{{ error }}</p>

        <div class="field"><label for="fe-name">Form name</label><input id="fe-name" v-model="draft.name" class="inp" type="text" maxlength="80"><span class="help">Only you see this. It’s how you pick the form on a page.</span></div>

        <div class="qs">
            <b class="qs-title">Questions</b>
            <div v-for="(f, i) in draft.fields" :key="f.id" class="q">
                <div class="q-row">
                    <div class="field grow">
                        <label :for="`q-${f.id}`">Question {{ i + 1 }}</label>
                        <input :id="`q-${f.id}`" v-model="f.label" class="inp" type="text" maxlength="120" placeholder="e.g. Your name">
                    </div>
                    <div class="field">
                        <label :for="`k-${f.id}`">Answer type</label>
                        <select :id="`k-${f.id}`" v-model="f.kind" class="inp">
                            <option v-for="k in FIELD_KINDS" :key="k.kind" :value="k.kind">{{ k.name }}</option>
                        </select>
                    </div>
                </div>
                <div v-if="f.kind === 'select'" class="field">
                    <label :for="`o-${f.id}`">Choices, one per line</label>
                    <textarea :id="`o-${f.id}`" class="inp" rows="3" :value="optionsText(f)" @change="setOptions(f, ($event.target as HTMLTextAreaElement).value)" />
                </div>
                <div class="q-tools">
                    <label class="check"><input v-model="f.required" type="checkbox">Must be filled in</label>
                    <span>
                        <button class="ib" type="button" :aria-label="`Move question ${i + 1} up`" :disabled="i === 0" @click="move(i, -1)">↑</button>
                        <button class="ib" type="button" :aria-label="`Move question ${i + 1} down`" :disabled="i === draft.fields.length - 1" @click="move(i, 1)">↓</button>
                        <button class="ib" type="button" :aria-label="`Remove question ${i + 1}`" @click="draft.fields.splice(i, 1)">✕</button>
                    </span>
                </div>
            </div>
            <button class="btn btn-ghost btn-sm self-start" type="button" @click="addField">Add a question</button>
        </div>

        <div class="field"><label for="fe-btn">Button text</label><input id="fe-btn" v-model="draft.submitLabel" class="inp" type="text" maxlength="40"></div>
        <div class="field"><label for="fe-ok">Message after sending</label><textarea id="fe-ok" v-model="draft.successMessage" class="inp" rows="3" maxlength="300" /></div>

        <div class="fe-actions">
            <button class="btn btn-dark" type="button" :disabled="!!busy" @click="save">{{ busy === 'save' ? 'Saving…' : 'Save form' }}</button>
            <template v-if="canDelete">
                <button v-if="!confirmDelete" class="btn btn-plain danger" type="button" @click="confirmDelete = true">Delete form</button>
                <span v-else class="confirm">
                    Delete this form and all its replies?
                    <button class="btn btn-sm del" type="button" :disabled="!!busy" @click="remove">{{ busy === 'delete' ? 'Deleting…' : 'Yes, delete' }}</button>
                    <button class="btn btn-plain btn-sm" type="button" @click="confirmDelete = false">Keep it</button>
                </span>
            </template>
        </div>
    </section>
</template>

<style scoped>
.fe { display: flex; flex-direction: column; gap: 18px; padding: 24px 28px; }
.fe-head { align-items: center; display: flex; justify-content: space-between; }
h2 { font-size: 20px; margin: 0; }
.field label { font-size: 14px; }
.inp { font-size: 15px; height: 42px; }
textarea.inp { height: auto; line-height: 1.5; padding: 10px 12px; resize: vertical; }
.qs { display: flex; flex-direction: column; gap: 12px; }
.qs-title { font-size: 15px; }
.q { background: var(--paper); border-radius: var(--radius-lg); box-shadow: 0 0 0 1px var(--line-soft); display: flex; flex-direction: column; gap: 12px; padding: 14px; }
.q-row { display: flex; flex-wrap: wrap; gap: 12px; }
.grow { flex: 1 1 240px; }
.q-tools { align-items: center; display: flex; justify-content: space-between; }
.check { align-items: center; display: flex; font-size: 14px; gap: 8px; }
.check input { accent-color: var(--quarry); height: 18px; width: 18px; }
.ib { background: transparent; border: 0; border-radius: var(--radius); cursor: pointer; height: 32px; width: 32px; }
.ib:hover:not(:disabled) { background: var(--mist); }
.ib:disabled { opacity: .3; }
.self-start { align-self: flex-start; }
.fe-actions { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; padding-top: 6px; }
.danger { color: var(--danger); }
.confirm { align-items: center; color: var(--danger); display: flex; flex-wrap: wrap; font-size: 14px; gap: 8px; }
.del { background: var(--danger); color: var(--white); }
</style>

<script setup lang="ts">
// One editable field of a block (or of one item in a block's list): text, long text, link,
// image (with the media picker), choice, or form.
import type { BlockField } from '#shared/utils/blockTypes'

const props = defineProps<{
    field: BlockField
    value: unknown
    id: string
    siteId?: string
    pages?: { title: string, path: string }[]
    forms?: FormDefinition[]
}>()
const emit = defineEmits<{ input: [value: string], pick: [item: MediaItem] }>()
const val = computed(() => String(props.value ?? (props.field.kind === 'select' ? props.field.options?.[0]?.value ?? '' : '')))
const read = (e: Event) => (e.target as HTMLInputElement).value
</script>

<template>
    <div class="field">
        <label :for="id">{{ field.label }}</label>
        <textarea v-if="field.kind === 'textarea'" :id="id" class="inp" rows="4" :value="val" @input="emit('input', read($event))" />
        <select v-else-if="field.kind === 'select'" :id="id" class="inp" :value="val" @change="emit('input', read($event))">
            <option v-for="o in field.options" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <template v-else-if="field.kind === 'form'">
            <select :id="id" class="inp" :value="val" @change="emit('input', read($event))">
                <option value="">Choose a form…</option>
                <option v-for="form in forms" :key="form.id" :value="form.id">{{ form.name }}</option>
            </select>
            <NuxtLink v-if="siteId" class="help" :to="`/sites/${siteId}/forms`">Edit forms and see replies</NuxtLink>
        </template>
        <template v-else>
            <input :id="id" class="inp" type="text" :value="val" :list="field.kind === 'url' ? `${id}-pages` : undefined" @input="emit('input', read($event))">
            <datalist v-if="field.kind === 'url'" :id="`${id}-pages`">
                <option v-for="p in pages" :key="p.path" :value="p.path">{{ p.title }}</option>
            </datalist>
            <span v-if="field.kind === 'image' && siteId" class="img-row">
                <img v-if="val" :src="val" alt="" class="img-thumb">
                <MediaPicker :site-id="siteId" @pick="emit('pick', $event)" />
                <button v-if="val" class="btn btn-plain btn-sm" type="button" @click="emit('input', '')">Remove</button>
            </span>
        </template>
        <span v-if="field.help" class="help">{{ field.help }}</span>
    </div>
</template>

<style scoped>
.field label { font-size: 14px; }
.inp { font-size: 15px; height: 42px; }
textarea.inp { height: auto; line-height: 1.5; min-height: 84px; padding: 10px 12px; resize: vertical; }
.img-row { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.img-thumb { border-radius: 4px; height: 40px; object-fit: cover; width: 56px; }
</style>

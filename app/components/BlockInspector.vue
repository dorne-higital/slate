<script setup lang="ts">
// Settings for the selected block, built from the block catalogue. Edits the block in place.
const props = defineProps<{ block: Block, pages: { title: string, path: string }[], forms?: FormDefinition[], siteId?: string }>()
const emit = defineEmits<{ change: [] }>()

const def = computed(() => findBlockType(props.block.type))
const items = computed(() => (props.block.props.items as Record<string, string>[] | undefined) ?? [])

function set(key: string, value: string) {
    props.block.props[key] = value
    emit('change')
}

function setItem(i: number, key: string, value: string) {
    items.value[i]![key] = value
    emit('change')
}

function addItem() {
    const row: Record<string, string> = {}
    for (const f of def.value!.items!.fields) row[f.key] = ''
    props.block.props.items = [...items.value, row]
    emit('change')
}

function moveItem(i: number, dir: -1 | 1) {
    const list = [...items.value]
    const [row] = list.splice(i, 1)
    list.splice(i + dir, 0, row!)
    props.block.props.items = list
    emit('change')
}

function removeItem(i: number) {
    props.block.props.items = items.value.filter((_, j) => j !== i)
    emit('change')
}

const inputValue = (e: Event) => (e.target as HTMLInputElement).value
</script>

<template>
    <div v-if="def" class="insp">
        <div class="insp-head">
            <b>{{ def.name }}</b>
            <span class="muted">Changes save as you type.</span>
        </div>

        <div v-for="f in def.fields" :key="f.key" class="field">
            <label :for="`f-${block.id}-${f.key}`">{{ f.label }}</label>
            <textarea v-if="f.kind === 'textarea'" :id="`f-${block.id}-${f.key}`" class="inp" rows="4" :value="String(block.props[f.key] ?? '')" @input="set(f.key, inputValue($event))" />
            <template v-else-if="f.kind === 'form'">
                <select :id="`f-${block.id}-${f.key}`" class="inp" :value="String(block.props[f.key] ?? '')" @change="set(f.key, inputValue($event))">
                    <option value="">Choose a form…</option>
                    <option v-for="form in forms" :key="form.id" :value="form.id">{{ form.name }}</option>
                </select>
                <NuxtLink v-if="siteId" class="help" :to="`/sites/${siteId}/forms`">Edit forms and see replies</NuxtLink>
            </template>
            <template v-else>
                <input :id="`f-${block.id}-${f.key}`" class="inp" type="text" :value="String(block.props[f.key] ?? '')" :list="f.kind === 'url' ? `pages-${block.id}` : undefined" @input="set(f.key, inputValue($event))">
                <datalist v-if="f.kind === 'url'" :id="`pages-${block.id}`">
                    <option v-for="p in pages" :key="p.path" :value="p.path">{{ p.title }}</option>
                </datalist>
            </template>
            <span v-if="f.help" class="help">{{ f.help }}</span>
        </div>

        <div v-if="def.items" class="items">
            <b class="items-title">{{ def.items.label }}s</b>
            <div v-for="(item, i) in items" :key="i" class="item">
                <div class="item-bar">
                    <span>{{ def.items.label }} {{ i + 1 }}</span>
                    <span class="item-tools">
                        <button class="ib" type="button" :aria-label="`Move ${def.items.label.toLowerCase()} ${i + 1} up`" :disabled="i === 0" @click="moveItem(i, -1)">↑</button>
                        <button class="ib" type="button" :aria-label="`Move ${def.items.label.toLowerCase()} ${i + 1} down`" :disabled="i === items.length - 1" @click="moveItem(i, 1)">↓</button>
                        <button class="ib" type="button" :aria-label="`Remove ${def.items.label.toLowerCase()} ${i + 1}`" @click="removeItem(i)">✕</button>
                    </span>
                </div>
                <div v-for="f in def.items.fields" :key="f.key" class="field">
                    <label :for="`f-${block.id}-${i}-${f.key}`">{{ f.label }}</label>
                    <textarea v-if="f.kind === 'textarea'" :id="`f-${block.id}-${i}-${f.key}`" class="inp" rows="3" :value="item[f.key] ?? ''" @input="setItem(i, f.key, inputValue($event))" />
                    <input v-else :id="`f-${block.id}-${i}-${f.key}`" class="inp" type="text" :value="item[f.key] ?? ''" @input="setItem(i, f.key, inputValue($event))">
                </div>
            </div>
            <button v-if="items.length < def.items.max" class="btn btn-ghost btn-sm" type="button" @click="addItem">Add {{ def.items.label.toLowerCase() }}</button>
        </div>
    </div>
</template>

<style scoped>
.insp { display: flex; flex-direction: column; gap: 18px; }
.insp-head { display: flex; flex-direction: column; gap: 2px; }
.insp-head b { font-size: 17px; }
.field label { font-size: 14px; }
.inp { font-size: 15px; height: 42px; }
textarea.inp { height: auto; line-height: 1.5; min-height: 84px; padding: 10px 12px; resize: vertical; }
.items { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 14px; padding-top: 16px; }
.items-title { font-size: 15px; }
.item { background: var(--paper); border-radius: var(--radius-lg); box-shadow: 0 0 0 1px var(--line-soft); display: flex; flex-direction: column; gap: 12px; padding: 12px; }
.item-bar { align-items: center; display: flex; font-size: 13px; font-weight: 700; justify-content: space-between; }
.item-tools { display: flex; gap: 2px; }
.ib { align-items: center; background: transparent; border: 0; border-radius: var(--radius); color: var(--quarry); cursor: pointer; display: inline-flex; font-size: 14px; height: 32px; justify-content: center; width: 32px; }
.ib:hover:not(:disabled) { background: var(--mist); }
.ib:disabled { cursor: default; opacity: .35; }
</style>

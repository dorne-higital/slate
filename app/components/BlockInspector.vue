<script setup lang="ts">
// Settings for the selected block, built from the block catalogue. Edits the block in place.
const props = defineProps<{ block: Block, pages: { title: string, path: string }[], forms?: FormDefinition[], siteId?: string }>()
const emit = defineEmits<{ change: [] }>()

const def = computed(() => findBlockType(props.block.type))
const items = computed(() => (props.block.props.items as Record<string, string>[] | undefined) ?? [])

// Picking from the library also fills in the matching description field if it's empty
function pickImage(key: string, item: MediaItem) {
    props.block.props[key] = item.url
    const altKey = key.replace(/Url$/, 'Alt')
    if (altKey !== key && item.alt && !props.block.props[altKey]) props.block.props[altKey] = item.alt
    emit('change')
}

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

function moveItem(i: number, to: number) {
    const list = [...items.value]
    moveInPlace(list, i, to)
    props.block.props.items = list
    emit('change')
}
const dr = useDragReorder(moveItem)

function removeItem(i: number) {
    props.block.props.items = items.value.filter((_, j) => j !== i)
    emit('change')
}

function pickItemImage(i: number, key: string, item: MediaItem) {
    items.value[i]![key] = item.url
    const altKey = key === 'url' ? 'alt' : key.replace(/Url$/, 'Alt')
    if (altKey !== key && item.alt && altKey in items.value[i]! && !items.value[i]![altKey]) items.value[i]![altKey] = item.alt
    emit('change')
}
</script>

<template>
    <div v-if="def" class="insp">
        <div class="insp-head">
            <b>{{ def.name }}</b>
            <span class="muted">Changes save as you type.</span>
        </div>

        <BlockField
            v-for="f in def.fields"
            :key="f.key"
            :field="f"
            :value="block.props[f.key]"
            :id="`f-${block.id}-${f.key}`"
            :site-id="siteId"
            :pages="pages"
            :forms="forms"
            @input="set(f.key, $event)"
            @pick="pickImage(f.key, $event)"
        />

        <div v-if="def.items" class="items">
            <b class="items-title">{{ def.items.label }}s</b>
            <div v-for="(item, i) in items" :key="i" class="item" data-drag-row :class="dr.rowClass(i)" @dragover="dr.overRow($event, i)" @drop.prevent="dr.drop">
                <div class="item-bar">
                    <span>{{ def.items.label }} {{ i + 1 }}</span>
                    <span class="item-tools">
                        <DragGrip @dragstart="dr.start($event, i)" @dragend="dr.end" />
                        <button class="ib" type="button" :aria-label="`Move ${def.items.label.toLowerCase()} ${i + 1} up`" :disabled="i === 0" @click="moveItem(i, i - 1)">↑</button>
                        <button class="ib" type="button" :aria-label="`Move ${def.items.label.toLowerCase()} ${i + 1} down`" :disabled="i === items.length - 1" @click="moveItem(i, i + 1)">↓</button>
                        <button class="ib" type="button" :aria-label="`Remove ${def.items.label.toLowerCase()} ${i + 1}`" @click="removeItem(i)">✕</button>
                    </span>
                </div>
                <BlockField
                    v-for="f in def.items.fields"
                    :key="f.key"
                    :field="f"
                    :value="item[f.key]"
                    :id="`f-${block.id}-${i}-${f.key}`"
                    :site-id="siteId"
                    :pages="pages"
                    @input="setItem(i, f.key, $event)"
                    @pick="pickItemImage(i, f.key, $event)"
                />
            </div>
            <button v-if="items.length < def.items.max" class="btn btn-ghost btn-sm" type="button" @click="addItem">Add {{ def.items.label.toLowerCase() }}</button>
        </div>

        <details class="section-opts">
            <summary>Section: background, spacing, fade-in</summary>
            <BlockField
                v-for="f in SECTION_FIELDS"
                :key="f.key"
                :field="f"
                :value="block.props[f.key]"
                :id="`f-${block.id}-${f.key}`"
                @input="set(f.key, $event)"
            />
        </details>
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
.item-tools { align-items: center; display: flex; gap: 2px; }
.ib { align-items: center; background: transparent; border: 0; border-radius: var(--radius); color: var(--quarry); cursor: pointer; display: inline-flex; font-size: 14px; height: 32px; justify-content: center; width: 32px; }
.ib:hover:not(:disabled) { background: var(--mist); }
.ib:disabled { cursor: default; opacity: .35; }
.img-row { align-items: center; display: flex; gap: 10px; margin-top: 6px; }
.img-thumb { border-radius: 4px; height: 40px; object-fit: cover; width: 56px; }
.section-opts { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 14px; padding-top: 14px; }
.section-opts summary { cursor: pointer; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
.section-opts[open] summary { margin-bottom: 12px; }
</style>

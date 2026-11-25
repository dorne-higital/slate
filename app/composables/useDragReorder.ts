/**
 * Drag to reorder a list by a handle (DragGrip). The arrow buttons stay for keyboards.
 * `moveTo(from, to)` gets the old index and the index the item should end up at.
 * Put `rowClass(i)` and the dragover/drop handlers on each row, and `start`/`end` on its grip.
 */
export function useDragReorder(moveTo: (from: number, to: number) => void, canDrop: (from: number, over: number) => boolean = () => true) {
    const from = ref<number | null>(null)
    const over = ref<{ i: number, after: boolean } | null>(null)

    function start(e: DragEvent, i: number) {
        from.value = i
        e.dataTransfer?.setData('text/plain', String(i))
        if (!e.dataTransfer) return
        e.dataTransfer.effectAllowed = 'move'
        const row = (e.target as HTMLElement).closest('[data-drag-row]')
        if (row) e.dataTransfer.setDragImage(row, 20, 20)
    }
    function overRow(e: DragEvent, i: number) {
        if (from.value === null) return
        if (!canDrop(from.value, i)) {
            over.value = null
            return
        }
        e.preventDefault()
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        over.value = { i, after: e.clientY > rect.top + rect.height / 2 }
    }
    function end() {
        from.value = null
        over.value = null
    }
    function drop() {
        const f = from.value
        const o = over.value
        end()
        if (f === null || !o) return
        let to = o.i + (o.after ? 1 : 0)
        if (to > f) to--
        if (to !== f) moveTo(f, to)
    }
    const rowClass = (i: number) => ({
        'dr-dragging': from.value === i,
        'dr-before': over.value?.i === i && !over.value.after,
        'dr-after': over.value?.i === i && over.value.after
    })
    return { start, overRow, drop, end, rowClass }
}

/** Move one item in an array to a new index, in place. */
export function moveInPlace<T>(list: T[], from: number, to: number) {
    const [item] = list.splice(from, 1)
    list.splice(to, 0, item!)
}

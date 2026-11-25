/**
 * Sorting, searching and pages for any table in the CMS. Give it the rows and how to sort and
 * search them; use table.rows for the rows on this page, SortTh for sortable headers and TablePager below.
 * `pin` keeps some rows at the top whatever the sort (the home page). `filter` is an extra
 * condition (status tabs and the like). Changing the search, sort or filter goes back to page 1.
 */
export type SortDir = 'asc' | 'desc'
type SortValue = string | number | boolean | Date | null | undefined

export interface DataTableOptions<T> {
    sorters?: Record<string, (row: T) => SortValue>
    search?: (row: T) => string
    filter?: () => ((row: T) => boolean) | null
    initialSort?: { key: string, dir: SortDir } | null
    pageSize?: number
    pin?: (row: T) => boolean
}

const collator = new Intl.Collator('en-GB', { numeric: true, sensitivity: 'base' })

function compare(a: SortValue, b: SortValue) {
    // Empty values always sink to the bottom
    const ea = a === null || a === undefined || a === ''
    const eb = b === null || b === undefined || b === ''
    if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1
    if (a instanceof Date || b instanceof Date) return new Date(a as Date).getTime() - new Date(b as Date).getTime()
    if (typeof a === 'number' && typeof b === 'number') return a - b
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
    return collator.compare(String(a), String(b))
}

export const useDataTable = <T>(source: () => T[], opts: DataTableOptions<T> = {}) => {
    const q = ref('')
    const sortKey = ref<string | null>(opts.initialSort?.key ?? null)
    const sortDir = ref<SortDir>(opts.initialSort?.dir ?? 'asc')
    const page = ref(1)
    const pageSize = ref(opts.pageSize ?? 25)

    const searching = computed(() => !!q.value.trim())

    const all = computed(() => {
        const term = q.value.trim().toLowerCase()
        const extra = opts.filter?.() ?? null
        let list = source().filter(r => (!extra || extra(r)) && (!term || !opts.search || opts.search(r).toLowerCase().includes(term)))
        const sorter = sortKey.value ? opts.sorters?.[sortKey.value] : undefined
        if (sorter) {
            const dir = sortDir.value === 'asc' ? 1 : -1
            list = list.map((r, i) => ({ r, i })).sort((x, y) => compare(sorter(x.r), sorter(y.r)) * dir || x.i - y.i).map(x => x.r)
        }
        if (opts.pin) list = [...list.filter(opts.pin), ...list.filter(r => !opts.pin!(r))]
        return list
    })

    const total = computed(() => all.value.length)
    const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
    const rows = computed(() => all.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
    const from = computed(() => total.value ? (page.value - 1) * pageSize.value + 1 : 0)
    const to = computed(() => Math.min(total.value, page.value * pageSize.value))

    // Back to page 1 whenever the list changes; never past the last page
    watch([q, sortKey, sortDir, pageSize, () => opts.filter?.()], () => (page.value = 1))
    watch(pageCount, n => { if (page.value > n) page.value = n })

    /** Click a column: sort by it A–Z, then Z–A, then back to the usual order. */
    function sortBy(key: string) {
        if (sortKey.value !== key) {
            sortKey.value = key
            sortDir.value = 'asc'
        } else if (sortDir.value === 'asc') {
            sortDir.value = 'desc'
        } else {
            sortKey.value = opts.initialSort?.key ?? null
            sortDir.value = opts.initialSort?.dir ?? 'asc'
        }
    }
    const ariaSort = (key: string) => sortKey.value === key ? (sortDir.value === 'asc' ? 'ascending' : 'descending') : 'none'
    /** True when rows are in their natural order (no column sort, no search): drag-to-reorder only makes sense then. */
    const natural = computed(() => !sortKey.value && !searching.value)

    return reactive({ q, sortKey, sortDir, page, pageSize, searching, all, total, pageCount, rows, from, to, natural, sortBy, ariaSort })
}

export type DataTable = ReturnType<typeof useDataTable>

// Last in the file: Nuxt's export scanner loses any export that follows an array literal like this
export const PAGE_SIZES = [10, 25, 50, 100]

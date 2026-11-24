/**
 * The block catalogue: every block type, its editable fields and starting content.
 * The editor builds its forms from this, and the server cleans every save against it,
 * so a block can only ever hold the fields listed here.
 */
export type FieldKind = 'text' | 'textarea' | 'url' | 'image' | 'form'

export interface BlockField {
    key: string
    label: string
    kind: FieldKind
    help?: string
    max?: number
}

export type BlockGroup = 'Headers and banners' | 'Text and images' | 'Show what you do' | 'Get in touch' | 'Blog'
export const BLOCK_GROUPS: BlockGroup[] = ['Headers and banners', 'Text and images', 'Show what you do', 'Get in touch', 'Blog']

export interface BlockType {
    type: string
    name: string
    desc: string
    /** Section in the editor's block library */
    group: BlockGroup
    fields: BlockField[]
    /** For blocks holding a repeating list (services, reviews…), stored as props.items */
    items?: { label: string, fields: BlockField[], max: number }
    defaults: Record<string, unknown>
}

const heading: BlockField = { key: 'heading', label: 'Heading', kind: 'text', max: 160 }
const body: BlockField = { key: 'body', label: 'Text', kind: 'textarea', help: 'Leave a blank line between paragraphs.', max: 8000 }
const buttonLabel: BlockField = { key: 'buttonLabel', label: 'Button text', kind: 'text', help: 'Leave empty for no button.', max: 60 }
const buttonUrl: BlockField = { key: 'buttonUrl', label: 'Button goes to', kind: 'url', help: 'A page like /get-a-quote, or a full web address.', max: 500 }

export const BLOCK_TYPES: BlockType[] = [
    {
        type: 'hero',
        group: 'Headers and banners',
        name: 'Hero',
        desc: 'Big heading, text and a button',
        fields: [heading, { key: 'text', label: 'Text', kind: 'textarea', max: 600 }, buttonLabel, buttonUrl],
        defaults: { heading: 'Your headline here', text: 'One or two sentences about what you do and who for.', buttonLabel: 'Get in touch', buttonUrl: '' }
    },
    {
        type: 'text',
        group: 'Text and images',
        name: 'Text',
        desc: 'Paragraphs with a heading',
        fields: [heading, body],
        defaults: { heading: 'About us', body: 'Write a few paragraphs here.' }
    },
    {
        type: 'imageText',
        group: 'Text and images',
        name: 'Image and text',
        desc: 'A picture beside some words',
        fields: [
            heading,
            body,
            { key: 'imageUrl', label: 'Image', kind: 'image', help: 'Choose from your media library, or paste an image address.', max: 1000 },
            { key: 'imageAlt', label: 'Describe the image', kind: 'text', help: 'For people using screen readers.', max: 200 }
        ],
        defaults: { heading: 'How we work', body: 'Tell people what it’s like to work with you.', imageUrl: '', imageAlt: '' }
    },
    {
        type: 'services',
        group: 'Show what you do',
        name: 'Services',
        desc: 'A grid of things you offer',
        fields: [heading, { key: 'intro', label: 'Intro', kind: 'textarea', max: 600 }],
        items: { label: 'Service', max: 12, fields: [{ key: 'title', label: 'Name', kind: 'text', max: 100 }, { key: 'text', label: 'Description', kind: 'textarea', max: 400 }] },
        defaults: {
            heading: 'What we do',
            intro: '',
            items: [
                { title: 'First service', text: 'A sentence about it.' },
                { title: 'Second service', text: 'A sentence about it.' },
                { title: 'Third service', text: 'A sentence about it.' }
            ]
        }
    },
    {
        type: 'reviews',
        group: 'Show what you do',
        name: 'Reviews',
        desc: 'Quotes from customers',
        fields: [heading],
        items: { label: 'Review', max: 12, fields: [{ key: 'quote', label: 'What they said', kind: 'textarea', max: 600 }, { key: 'name', label: 'Who said it', kind: 'text', max: 100 }] },
        defaults: { heading: 'What customers say', items: [{ quote: 'Paste a review from a happy customer here.', name: 'Their name, where they’re from' }] }
    },
    {
        type: 'faq',
        group: 'Show what you do',
        name: 'Questions and answers',
        desc: 'Expandable list of questions',
        fields: [heading],
        items: { label: 'Question', max: 30, fields: [{ key: 'question', label: 'Question', kind: 'text', max: 200 }, { key: 'answer', label: 'Answer', kind: 'textarea', max: 2000 }] },
        defaults: { heading: 'Questions people ask', items: [{ question: 'How long does it take?', answer: 'Answer the question here.' }] }
    },
    {
        type: 'form',
        group: 'Get in touch',
        name: 'Form',
        desc: 'Any form from your Forms inbox',
        fields: [heading, { key: 'intro', label: 'Intro', kind: 'textarea', max: 600 }, { key: 'formId', label: 'Form', kind: 'form', help: 'Replies go to your Forms inbox.' }],
        defaults: { heading: 'Get in touch', intro: '', formId: '' }
    },
    {
        type: 'latestPosts',
        group: 'Blog',
        name: 'Latest posts',
        desc: 'Newest posts from your blog',
        fields: [heading, { key: 'count', label: 'How many posts', kind: 'text', help: 'A number from 1 to 12.', max: 2 }],
        defaults: { heading: 'From the blog', count: '3' }
    },
    {
        type: 'booking',
        group: 'Get in touch',
        name: 'Booking',
        desc: 'Your Calendly booking calendar',
        fields: [heading, { key: 'intro', label: 'Intro', kind: 'textarea', max: 600 }],
        defaults: { heading: 'Book a time', intro: 'Pick a time that suits you.' }
    },
    {
        type: 'cta',
        group: 'Headers and banners',
        name: 'Call to action',
        desc: 'A dark band with one button',
        fields: [heading, { key: 'text', label: 'Text', kind: 'textarea', max: 400 }, buttonLabel, buttonUrl],
        defaults: { heading: 'Ready to start?', text: '', buttonLabel: 'Get in touch', buttonUrl: '' }
    }
]

export function findBlockType(type: string): BlockType | undefined {
    return BLOCK_TYPES.find(b => b.type === type)
}

export function newBlock(type: string): Block {
    const def = findBlockType(type)!
    return { id: crypto.randomUUID(), type, props: structuredClone(def.defaults) }
}

/** Only web, mail, phone and on-site links. Anything else (javascript:, data:…) becomes empty. */
export function safeUrl(value: string): string {
    const v = value.trim()
    if (!v) return ''
    if (v.startsWith('/') && !v.startsWith('//')) return v
    if (v.startsWith('#')) return v
    if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(v)) return `https://${v}`
    return ''
}

function cleanField(field: BlockField, raw: unknown): string {
    const value = typeof raw === 'string' ? raw : ''
    if (field.kind === 'form') return /^[0-9a-f-]{36}$/i.test(value) ? value : ''
    const cut = value.slice(0, field.max ?? 1000)
    return field.kind === 'url' || field.kind === 'image' ? safeUrl(cut) : cut
}

/** Rebuilds blocks from the catalogue, dropping unknown types and fields. Used on every save. */
export function cleanBlocks(input: unknown): Block[] {
    if (!Array.isArray(input)) return []
    const out: Block[] = []
    for (const raw of input.slice(0, 100)) {
        if (!raw || typeof raw !== 'object') continue
        const { id, type, props } = raw as { id?: unknown, type?: unknown, props?: Record<string, unknown> }
        const def = typeof type === 'string' ? findBlockType(type) : undefined
        if (!def) continue
        const clean: Record<string, unknown> = {}
        for (const f of def.fields) clean[f.key] = cleanField(f, props?.[f.key])
        if (def.items) {
            const items = Array.isArray(props?.items) ? props.items.slice(0, def.items.max) : []
            clean.items = items.map((item: Record<string, unknown>) => {
                const row: Record<string, string> = {}
                for (const f of def.items!.fields) row[f.key] = cleanField(f, item?.[f.key])
                return row
            })
        }
        out.push({ id: typeof id === 'string' && /^[\w-]{1,64}$/.test(id) ? id : crypto.randomUUID(), type: def.type, props: clean })
    }
    return out
}

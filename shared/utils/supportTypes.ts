/** Kinds of support request, the questions each asks, and bug severity. Used by the form, the server and the helpdesk. */
export type TicketCategory = 'bug' | 'feature' | 'help' | 'billing' | 'domain'
export type TicketSeverity = 'p1' | 'p2' | 'p3'

export interface TicketQuestion {
    key: string
    label: string
    kind: 'text' | 'textarea' | 'select'
    required?: boolean
    placeholder?: string
    options?: string[]
}

export interface TicketCategoryInfo {
    key: TicketCategory
    name: string
    desc: string
    /** 18×18 stroke icon path */
    icon: string
    /** Tag colours in the helpdesk */
    colour: { bg: string, fg: string }
    questions: TicketQuestion[]
    /** Label for the free-text box at the end */
    moreLabel: string
}

export const TICKET_CATEGORIES: TicketCategoryInfo[] = [
    {
        key: 'bug', name: 'Something’s broken', desc: 'A page, block or setting isn’t working',
        icon: 'M9 3v2M5 5l1.5 1.5M13 5l-1.5 1.5M6 8h6v4a3 3 0 0 1-6 0zM3 10h3M12 10h3M4 14l2-1M14 14l-2-1',
        colour: { bg: '#fbeceb', fg: '#a3261b' },
        questions: [
            { key: 'where', label: 'Which page or address?', kind: 'text', required: true, placeholder: 'e.g. yoursite.co.uk/contact, or Pages › Home in the editor' },
            { key: 'did', label: 'What were you doing?', kind: 'textarea', required: true, placeholder: 'The steps, in order: I opened…, I pressed…' },
            { key: 'expected', label: 'What did you expect to happen?', kind: 'textarea', required: true },
            { key: 'happened', label: 'What happened instead?', kind: 'textarea', required: true, placeholder: 'Copy any error message you saw' },
            { key: 'device', label: 'What are you using?', kind: 'select', options: ['Chrome on a computer', 'Safari on a Mac', 'Edge', 'Firefox', 'iPhone or iPad', 'Android phone or tablet', 'Not sure'] }
        ],
        moreLabel: 'Anything else? (optional)'
    },
    {
        key: 'feature', name: 'New block or feature', desc: 'Something you’d like Slate to do',
        icon: 'M9 3v12M3 9h12M4.5 4.5h9v9h-9z',
        colour: { bg: '#efeafb', fg: '#5b3fa8' },
        questions: [
            { key: 'what', label: 'What would you like?', kind: 'textarea', required: true, placeholder: 'e.g. a price list block with tabs for each service' },
            { key: 'why', label: 'What would you use it for?', kind: 'textarea', required: true, placeholder: 'Which page, and what it would help your visitors do' },
            { key: 'examples', label: 'Any websites that do it well? (optional)', kind: 'textarea', placeholder: 'Paste links, one per line' },
            { key: 'when', label: 'How soon do you need it?', kind: 'select', options: ['Whenever it’s ready', 'Within a month', 'This week'] }
        ],
        moreLabel: 'Anything else? (optional)'
    },
    {
        key: 'help', name: 'Help using Slate', desc: 'How do I…? questions',
        icon: 'M9 15.5a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13zM7 7a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2v.5M9 12.5v.5',
        colour: { bg: '#e8f1fb', fg: '#22477a' },
        questions: [
            { key: 'goal', label: 'What are you trying to do?', kind: 'textarea', required: true },
            { key: 'where', label: 'Where are you stuck? (optional)', kind: 'text', placeholder: 'e.g. Theme, or the Menus page' }
        ],
        moreLabel: 'Anything else? (optional)'
    },
    {
        key: 'billing', name: 'Billing or plan', desc: 'Payments, invoices, changing plan',
        icon: 'M2.5 5h13v8h-13zM2.5 8h13M5 11h3',
        colour: { bg: '#e8f3ec', fg: '#24613a' },
        questions: [
            { key: 'topic', label: 'What’s it about?', kind: 'select', required: true, options: ['An invoice or receipt', 'Changing or cancelling my plan', 'A payment that failed', 'A refund', 'Something else'] }
        ],
        moreLabel: 'Tell us more'
    },
    {
        key: 'domain', name: 'Domain or email', desc: 'Your web address, DNS or email',
        icon: 'M9 15.5a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13zM2.5 9h13M9 2.5c2 2 2 11 0 13M9 2.5c-2 2-2 11 0 13',
        colour: { bg: '#fff3de', fg: '#8a5300' },
        questions: [
            { key: 'domain', label: 'Which domain?', kind: 'text', required: true, placeholder: 'e.g. yourbusiness.co.uk' },
            { key: 'problem', label: 'What’s wrong?', kind: 'select', required: true, options: ['My site doesn’t load on it', 'I want to connect a domain I own', 'I want to buy a domain', 'I want to move my domain away', 'Email isn’t working', 'Something else'] }
        ],
        moreLabel: 'Tell us more'
    }
]

export const TICKET_SEVERITIES: { key: TicketSeverity, name: string, desc: string, colour: { bg: string, fg: string } }[] = [
    { key: 'p1', name: 'P1, urgent', desc: 'My website is down, or I can’t use Slate at all', colour: { bg: '#a3261b', fg: '#ffffff' } },
    { key: 'p2', name: 'P2, important', desc: 'Something important isn’t working, but there’s a way round it', colour: { bg: '#f0b24f', fg: '#3a2400' } },
    { key: 'p3', name: 'P3, minor', desc: 'A small problem or something that looks wrong', colour: { bg: '#dfe3ea', fg: '#3b4a6b' } }
]

export const findTicketCategory = (key: unknown) => TICKET_CATEGORIES.find(c => c.key === key)

/** Checks a new ticket's answers. Returns the clean answers, or a message saying what's missing. */
export function cleanTicketAnswers(category: TicketCategoryInfo, raw: unknown): { ok: true, answers: Record<string, string> } | { ok: false, message: string } {
    const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const answers: Record<string, string> = {}
    for (const q of category.questions) {
        const v = typeof input[q.key] === 'string' ? (input[q.key] as string).trim().slice(0, q.kind === 'textarea' ? 2000 : 300) : ''
        if (q.kind === 'select' && v && !q.options?.includes(v)) return { ok: false, message: `Pick an answer for “${q.label}”.` }
        if (q.required && !v) return { ok: false, message: `Please answer “${q.label}”.` }
        if (v) answers[q.key] = v
    }
    return { ok: true, answers }
}

/** The first message of a ticket: every answer under its question, then anything else they wrote. */
export function ticketSummary(category: TicketCategoryInfo, severity: TicketSeverity | null, answers: Record<string, string>, more: string) {
    const lines = [`Type: ${category.name}${severity ? ` (${TICKET_SEVERITIES.find(s => s.key === severity)?.name})` : ''}`]
    for (const q of category.questions) if (answers[q.key]) lines.push('', `${q.label.replace(/ \(optional\)$/, '')}`, answers[q.key]!)
    if (more.trim()) lines.push('', 'More detail', more.trim())
    return lines.join('\n')
}

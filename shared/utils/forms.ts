export type FormFieldKind = 'text' | 'email' | 'phone' | 'textarea' | 'select'

export interface FormField {
    id: string
    label: string
    kind: FormFieldKind
    required: boolean
    /** Choices for a select field */
    options?: string[]
}

export interface FormDefinition {
    id: string
    name: string
    fields: FormField[]
    submitLabel: string
    successMessage: string
}

export const FIELD_KINDS: { kind: FormFieldKind, name: string }[] = [
    { kind: 'text', name: 'Short answer' },
    { kind: 'textarea', name: 'Long answer' },
    { kind: 'email', name: 'Email address' },
    { kind: 'phone', name: 'Phone number' },
    { kind: 'select', name: 'Pick from a list' }
]

export function defaultContactFields(): FormField[] {
    return [
        { id: crypto.randomUUID(), label: 'Your name', kind: 'text', required: true },
        { id: crypto.randomUUID(), label: 'Email', kind: 'email', required: true },
        { id: crypto.randomUUID(), label: 'Phone', kind: 'phone', required: false },
        { id: crypto.randomUUID(), label: 'Message', kind: 'textarea', required: true }
    ]
}

/** Rebuilds a form definition from untrusted input. */
export function cleanFormInput(input: unknown) {
    const r = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
    const kinds = FIELD_KINDS.map(k => k.kind)
    const fields: FormField[] = (Array.isArray(r.fields) ? r.fields : []).slice(0, 30).flatMap((raw) => {
        const f = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
        const label = str(f.label, 120)
        if (!label) return []
        const kind = kinds.includes(f.kind as FormFieldKind) ? f.kind as FormFieldKind : 'text'
        const field: FormField = {
            id: typeof f.id === 'string' && /^[\w-]{1,64}$/.test(f.id) ? f.id : crypto.randomUUID(),
            label,
            kind,
            required: f.required === true
        }
        if (kind === 'select') {
            field.options = (Array.isArray(f.options) ? f.options : []).map(o => str(o, 100)).filter(Boolean).slice(0, 30)
        }
        return [field]
    })
    return {
        name: str(r.name, 80) || 'Untitled form',
        fields,
        submitLabel: str(r.submitLabel, 40) || 'Send',
        successMessage: str(r.successMessage, 300) || 'Thanks, we’ve got your message and will be in touch soon.'
    }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Checks a visitor's answers against the form. Returns cleaned answers keyed by field label, or the first problem. */
export function validateSubmission(form: Pick<FormDefinition, 'fields'>, answers: Record<string, unknown>):
    { ok: true, data: Record<string, string> } | { ok: false, fieldId: string, message: string } {
    const data: Record<string, string> = {}
    for (const field of form.fields) {
        const raw = answers[field.id]
        const value = typeof raw === 'string' ? raw.trim().slice(0, field.kind === 'textarea' ? 5000 : 300) : ''
        if (field.required && !value) return { ok: false, fieldId: field.id, message: `Please fill in “${field.label}”.` }
        if (value && field.kind === 'email' && !EMAIL.test(value)) return { ok: false, fieldId: field.id, message: 'That email address doesn’t look right.' }
        if (value && field.kind === 'phone' && !/^[\d\s()+-]{6,20}$/.test(value)) return { ok: false, fieldId: field.id, message: 'That phone number doesn’t look right.' }
        if (value && field.kind === 'select' && !(field.options ?? []).includes(value)) return { ok: false, fieldId: field.id, message: `Please pick an option for “${field.label}”.` }
        if (value) data[field.label] = value
    }
    return { ok: true, data }
}

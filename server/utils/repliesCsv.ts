/** A form's replies as CSV text (UTF-8 BOM so Excel reads accents). Formulas are neutralised. */
export function repliesCsv(form: { fields: FormField[] }, rows: (typeof schema.formReplies.$inferSelect)[]) {
    // Current questions first, then any older ones that only appear in past replies
    const columns = [...new Set([...form.fields.map(f => f.label), ...rows.flatMap(r => Object.keys(r.data))])]
    const cell = (v: string) => {
        // Neutralise spreadsheet formulas (=, +, -, @) so a reply can't run anything when opened
        const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
        return `"${safe.replace(/"/g, '""')}"`
    }
    const lines = [
        ['Sent', ...columns, 'Page', 'Done', 'Note'].map(cell).join(','),
        ...rows.map(r => [
            r.createdAt.toISOString().replace('T', ' ').slice(0, 16),
            ...columns.map(c => r.data[c] ?? ''),
            r.pagePath ?? '',
            r.doneAt ? 'Yes' : 'No',
            r.note ?? ''
        ].map(cell).join(','))
    ]
    return '﻿' + lines.join('\r\n')
}

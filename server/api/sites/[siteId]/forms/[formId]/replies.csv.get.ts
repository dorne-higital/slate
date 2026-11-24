import { desc, eq } from 'drizzle-orm'

/** Every reply to a form as a CSV file (opens in Excel, Numbers or Google Sheets). */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const form = await requireForm(site.id, getRouterParam(event, 'formId')!)
    const rows = await useDb().select().from(schema.formReplies).where(eq(schema.formReplies.formId, form.id)).orderBy(desc(schema.formReplies.createdAt))

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

    const filename = `${slugify(form.name) || 'form'}-replies.csv`
    setResponseHeaders(event, {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'no-store'
    })
    return '﻿' + lines.join('\r\n')
})

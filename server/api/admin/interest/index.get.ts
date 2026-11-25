import { desc } from 'drizzle-orm'

/** Everyone who registered interest. ?format=csv downloads them. Platform admins only. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const rows = await useDb().select().from(schema.interestSignups).orderBy(desc(schema.interestSignups.createdAt))
    if (getQuery(event).format === 'csv') {
        const cell = (v: string | null) => `"${String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, '\'$1')}"`
        setResponseHeader(event, 'content-type', 'text/csv; charset=utf-8')
        setResponseHeader(event, 'content-disposition', 'attachment; filename="slate-interest.csv"')
        return ['Email,Name,Business,Signed up', ...rows.map(r => [r.email, r.name, r.business, r.createdAt.toISOString()].map(cell).join(','))].join('\n')
    }
    return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))
})

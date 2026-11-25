import { getTableName, sql } from 'drizzle-orm'
import { gzipSync, strToU8 } from 'fflate'

/** Tables in the order a restore must insert them (parents before children). Sessions, sign-in codes and the error log are left out. */
const TABLES = [
    schema.user, schema.account, schema.sites, schema.siteMembers, schema.pages, schema.menus, schema.domains, schema.forms,
    schema.formReplies, schema.postCategories, schema.posts, schema.invites, schema.media, schema.billingAccounts,
    schema.customInvoices, schema.domainOrders, schema.supportTickets, schema.supportMessages
]
const KEEP = 8

export interface BackupInfo { key: string, size: number, rows: number, createdAt: string }

export function useBackupStorage() {
    return useStorage('backups')
}

async function readIndex(): Promise<BackupInfo[]> {
    return (await useBackupStorage().getItem<BackupInfo[]>('index.json')) ?? []
}

/**
 * Copies every table (raw column names, as JSON) into one gzipped file in private storage, and keeps the newest 8.
 * Restore with scripts/restore-backup.ts. Media files aren't copied: they're already in R2 and never changed in place.
 */
export async function runBackup(): Promise<BackupInfo> {
    const db = useDb()
    const tables: { name: string, rows: Record<string, unknown>[] }[] = []
    for (const t of TABLES) {
        const name = getTableName(t)
        // Child pages after their parents, so a restore never meets a missing parent
        const order = name === 'pages' ? sql` order by parent_id nulls first, created_at` : sql``
        const res = await db.execute(sql`select * from ${sql.identifier(name)}${order}`)
        tables.push({ name, rows: res.rows as Record<string, unknown>[] })
    }
    const createdAt = new Date()
    const body = gzipSync(strToU8(JSON.stringify({ format: 'slate-backup-1', createdAt: createdAt.toISOString(), tables })), { level: 6 })
    const key = `slate-${createdAt.toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json.gz`
    const storage = useBackupStorage()
    await storage.setItemRaw(key, body)
    const info: BackupInfo = { key, size: body.length, rows: tables.reduce((n, t) => n + t.rows.length, 0), createdAt: createdAt.toISOString() }

    const all = [info, ...(await readIndex()).filter(b => b.key !== key)]
    for (const old of all.slice(KEEP)) await storage.removeItem(old.key)
    await storage.setItem('index.json', all.slice(0, KEEP))
    return info
}

export async function listBackups() {
    return readIndex()
}

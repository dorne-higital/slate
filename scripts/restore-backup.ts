/**
 * Restores a Slate backup (from Admin → Backups) into an EMPTY database that already has Slate's tables
 * (e.g. a new Neon branch created "schema only", or one you've run `yarn db:migrate` against).
 *
 *   RESTORE_DATABASE_URL=postgres://… node --experimental-strip-types scripts/restore-backup.ts slate-2026-11-27-02-00.json.gz
 *   Add --check to only read the file and print what's in it.
 *
 * It never touches a database with data in it. To swap the live site over, point NUXT_DATABASE_URL at the restored branch.
 */
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { neon } from '@neondatabase/serverless'

const file = process.argv.find(a => a.endsWith('.json.gz'))
const checkOnly = process.argv.includes('--check')
if (!file) throw new Error('Give the backup file, e.g. slate-2026-11-27-02-00.json.gz')
const backup = JSON.parse(gunzipSync(readFileSync(file)).toString('utf8')) as { format: string, createdAt: string, tables: { name: string, rows: Record<string, unknown>[] }[] }
if (backup.format !== 'slate-backup-1') throw new Error('That isn’t a Slate backup file')
console.log(`Backup from ${backup.createdAt}`)
for (const t of backup.tables) console.log(`  ${t.name.padEnd(18)} ${t.rows.length}`)
if (checkOnly) process.exit(0)

const url = process.env.RESTORE_DATABASE_URL
if (!url) throw new Error('Set RESTORE_DATABASE_URL to the empty database to restore into')
const sql = neon(url)
const schemaName = process.env.RESTORE_SCHEMA ?? 'public'
if (!/^[a-z_][a-z0-9_]*$/.test(schemaName)) throw new Error('RESTORE_SCHEMA must be a plain schema name')
const table = (name: string) => `"${schemaName}"."${name}"`
for (const t of backup.tables) {
    const [{ n }] = await sql.query(`select count(*)::int n from ${table(t.name)}`) as { n: number }[]
    if (n > 0) throw new Error(`"${t.name}" already has ${n} rows. Restore only into an empty database.`)
}
for (const t of backup.tables) {
    for (let i = 0; i < t.rows.length; i += 500) {
        const batch = t.rows.slice(i, i + 500)
        await sql.query(`insert into ${table(t.name)} select * from json_populate_recordset(null::${table(t.name)}, $1::json)`, [JSON.stringify(batch)])
    }
    console.log(`restored ${t.name}: ${t.rows.length}`)
}
console.log('Done.')

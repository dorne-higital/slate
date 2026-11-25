/** Twice a week (Monday and Thursday, 02:00 UTC): a full copy of the database into private storage. */
export default defineTask({
    meta: { name: 'backup:database', description: 'Back up the database to R2' },
    async run() {
        try {
            const info = await runBackup()
            console.log('[backup]', JSON.stringify(info))
            return { result: info }
        } catch (err) {
            await logServerError(err)
            await alertPlatformAdmins('Backup failed', `Tonight's database backup didn't work.\n\n${(err as Error).message}\n\nRun one by hand from Admin → Backups once it's fixed.`)
            throw err
        }
    }
})

/** Back up now. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    return runBackup()
})

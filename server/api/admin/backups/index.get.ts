export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    return listBackups()
})

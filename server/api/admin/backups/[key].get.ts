/** Downloads one backup file. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const key = String(getRouterParam(event, 'key'))
    if (!/^slate-[\d-]+\.json\.gz$/.test(key) || !(await listBackups()).some(b => b.key === key)) throw createError({ statusCode: 404, statusMessage: 'Backup not found' })
    const data = await useBackupStorage().getItemRaw<Uint8Array | ArrayBuffer>(key)
    if (!data) throw createError({ statusCode: 404, statusMessage: 'Backup not found' })
    setResponseHeaders(event, { 'content-type': 'application/gzip', 'content-disposition': `attachment; filename="${key}"`, 'cache-control': 'no-store' })
    return data instanceof Uint8Array ? data : new Uint8Array(data)
})

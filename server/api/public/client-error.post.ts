import { and, eq, gt, sql } from 'drizzle-orm'

/**
 * Errors from visitors' browsers (Slate dashboard or a client site), recorded in the error log with status 0.
 * Open to anyone, so it's bounded: repeats of the same error within 10 minutes aren't stored again,
 * and at most 300 browser errors are kept per hour across Slate.
 */
export default defineEventHandler(async (event) => {
    const b = await readBody<{ message?: unknown, stack?: unknown, path?: unknown }>(event).catch(() => null)
    const message = typeof b?.message === 'string' ? b.message.slice(0, 500).trim() : ''
    if (!message) return { ok: true }
    const stack = typeof b?.stack === 'string' ? b.stack.slice(0, 3000) : ''
    const path = typeof b?.path === 'string' && b.path.startsWith('/') ? b.path.split('?')[0]!.slice(0, 300) : null
    // Noise we can't act on
    if (/chrome-extension:|moz-extension:|safari-extension:/.test(stack) || /^Script error\.?$/.test(message) || /ResizeObserver loop/.test(message)) return { ok: true }

    const db = useDb()
    const hourAgo = new Date(Date.now() - 3600 * 1000)
    const [{ n } = { n: 0 }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.errorLogs).where(and(eq(schema.errorLogs.status, 0), gt(schema.errorLogs.createdAt, hourAgo)))
    if (n >= 300) return { ok: true }
    const fingerprint = await browserFingerprint(message, path)
    const recent = await db.select({ id: schema.errorLogs.id }).from(schema.errorLogs)
        .where(and(eq(schema.errorLogs.fingerprint, fingerprint), gt(schema.errorLogs.createdAt, new Date(Date.now() - 10 * 60 * 1000)))).limit(1)
    if (recent.length) return { ok: true }
    await logBrowserError(event, { message: `Browser: ${message}`, stack: stack || null, path, fingerprint })
    return { ok: true }
})

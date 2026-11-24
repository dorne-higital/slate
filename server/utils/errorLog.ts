import { and, eq, gt, ne, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'

const ALERTS_PER_DAY = 20

async function sha1(text: string) {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

/** Same error, same place → same group. Numbers and ids are blanked so repeats group together. */
function normalise(s: string) {
    return s.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id').replace(/\d+/g, 'n').slice(0, 300)
}

/**
 * Records a server error (5xx) and emails platform admins the first time a kind of error appears in an hour.
 * Never throws: logging must not make things worse.
 */
export async function logServerError(error: unknown, event?: H3Event) {
    try {
        const err = error as { statusCode?: number, message?: string, statusMessage?: string, stack?: string, cause?: { message?: string, stack?: string } }
        const status = err.statusCode ?? 500
        if (status < 500) return
        const inner = err.cause?.message && err.cause.message !== err.message ? `: ${err.cause.message}` : ''
        const message = `${err.message || err.statusMessage || 'Unknown error'}${inner}`.slice(0, 1000)
        const stack = (err.cause?.stack ?? err.stack ?? '').slice(0, 4000) || null
        const path = event ? (event.path ?? '').split('?')[0]!.slice(0, 300) : null
        const fingerprint = await sha1(`${status}|${normalise(message)}|${normalise(path ?? '')}`)
        const db = useDb()
        const userId = (event?.context as { user?: { id?: string } } | undefined)?.user?.id ?? null
        const [row] = await db.insert(schema.errorLogs).values({
            fingerprint, message, stack, status, path,
            method: event?.method ?? null,
            host: event ? (getRequestHost(event, { xForwardedHost: false }) ?? '').slice(0, 200) : null,
            userId
        }).returning({ id: schema.errorLogs.id })

        const hourAgo = new Date(Date.now() - 3600 * 1000)
        const recent = await db.select({ id: schema.errorLogs.id }).from(schema.errorLogs)
            .where(and(eq(schema.errorLogs.fingerprint, fingerprint), gt(schema.errorLogs.createdAt, hourAgo), ne(schema.errorLogs.id, row!.id))).limit(1)
        if (recent.length) return
        const [{ groups } = { groups: 0 }] = await db.select({ groups: sql<number>`count(distinct fingerprint)::int` }).from(schema.errorLogs)
            .where(gt(schema.errorLogs.createdAt, new Date(Date.now() - 24 * 3600 * 1000)))
        if (groups > ALERTS_PER_DAY) return
        await alertPlatformAdmins(`Error: ${message.slice(0, 80)}`, `Slate hit an error.\n\n${message}\n\n${event?.method ?? ''} ${path ?? '(no request)'}\nStatus ${status}\n\nSee every error in Admin → Errors: ${appUrl('/admin/errors')}`)
    } catch (e) {
        console.error('[error-log] could not record error', e)
    }
}

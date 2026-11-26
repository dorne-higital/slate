import { and, eq, gt, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'

export interface FormSubmission { answers?: Record<string, unknown>, website?: string, startedAt?: number, page?: string }

/**
 * Takes one visitor's form reply: drops bots, checks the answers, limits repeats, stores it and
 * sends the notifications. Used by client sites' forms and by slatecms.co.uk/contact.
 * Spam protection: a hidden "website" field bots fill in, a minimum time on the page,
 * and at most 5 replies per sender per form every 10 minutes.
 */
export async function acceptFormReply(event: H3Event, site: typeof schema.sites.$inferSelect, form: typeof schema.forms.$inferSelect, body: FormSubmission) {
    const thanks = { ok: true, message: form.successMessage }

    // Bots: pretend it worked so they don't retry, but keep nothing
    if (body.website) return thanks
    if (typeof body.startedAt === 'number' && Date.now() - body.startedAt < 2000) return thanks

    const result = validateSubmission(form, body.answers ?? {})
    if (!result.ok) throw createError({ statusCode: 400, statusMessage: result.message, data: { fieldId: result.fieldId } })

    const ip = getRequestHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    const hash = await senderHash(ip)
    const db = useDb()
    const [recent] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.formReplies)
        .where(and(eq(schema.formReplies.formId, form.id), eq(schema.formReplies.senderHash, hash), gt(schema.formReplies.createdAt, new Date(Date.now() - 10 * 60 * 1000))))
    if ((recent?.n ?? 0) >= 5) {
        throw createError({ statusCode: 429, statusMessage: 'You’ve sent this form a few times already. Please wait a few minutes and try again.' })
    }

    const page = typeof body.page === 'string' && body.page.startsWith('/') ? body.page.slice(0, 300) : null
    const [reply] = await db.insert(schema.formReplies).values({ siteId: site.id, formId: form.id, data: result.data, pagePath: page, senderHash: hash }).returning({ id: schema.formReplies.id })
    notifyFormReply(event, site, form, result.data, page, reply!.id)
    return thanks
}

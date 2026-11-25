import { and, eq } from 'drizzle-orm'

export async function requireForm(siteId: string, formId: string) {
    if (!isUuid(formId)) throw createError({ statusCode: 404, statusMessage: 'Form not found' })
    const form = await useDb().query.forms.findFirst({ where: and(eq(schema.forms.id, formId), eq(schema.forms.siteId, siteId)) })
    if (!form) throw createError({ statusCode: 404, statusMessage: 'Form not found' })
    return form
}

export async function requireReply(siteId: string, replyId: string) {
    if (!isUuid(replyId)) throw createError({ statusCode: 404, statusMessage: 'Reply not found' })
    const reply = await useDb().query.formReplies.findFirst({ where: and(eq(schema.formReplies.id, replyId), eq(schema.formReplies.siteId, siteId)) })
    if (!reply) throw createError({ statusCode: 404, statusMessage: 'Reply not found' })
    return reply
}

export function toFormDefinition(f: typeof schema.forms.$inferSelect): FormDefinition {
    return { id: f.id, name: f.name, fields: f.fields, submitLabel: f.submitLabel, successMessage: f.successMessage }
}

export function toReply(r: typeof schema.formReplies.$inferSelect) {
    return {
        id: r.id,
        formId: r.formId,
        data: r.data,
        pagePath: r.pagePath,
        read: !!r.readAt,
        done: !!r.doneAt,
        note: r.note ?? '',
        createdAt: r.createdAt.toISOString()
    }
}

/** Salted SHA-256 of the sender's IP, so we can rate-limit without storing the address. */
export async function senderHash(ip: string) {
    const salt = useRuntimeConfig().betterAuthSecret
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`))
    return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

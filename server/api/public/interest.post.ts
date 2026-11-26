import { sql } from 'drizzle-orm'

/** Register interest from the coming-soon page. Spam: hidden field, Turnstile, email check; repeats are quietly accepted. */
export default defineEventHandler(async (event) => {
    const b = await readBody<{ email?: string, name?: string, business?: string, website?: string, turnstile?: string, source?: unknown }>(event)
    if (b.website) return { ok: true }
    const email = String(b.email ?? '').trim().toLowerCase().slice(0, 200)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError({ statusCode: 400, statusMessage: 'Enter your email address, like name@business.co.uk' })
    if (!await verifyTurnstile(b.turnstile, requestIp(event))) throw createError({ statusCode: 400, statusMessage: TURNSTILE_FAILED })
    const problem = await checkEmailAddress(email)
    if (problem) throw createError({ statusCode: 400, statusMessage: problem })
    const name = String(b.name ?? '').trim().slice(0, 120) || null
    const business = String(b.business ?? '').trim().slice(0, 160) || null
    const added = await useDb().insert(schema.interestSignups).values({ email, name, business, source: cleanSource(b.source) })
        .onConflictDoNothing({ target: schema.interestSignups.email }).returning({ id: schema.interestSignups.id })
    if (added.length) {
        const n = (await useDb().execute<{ n: number }>(sql`select count(*)::int n from interest_signups`)).rows[0]?.n ?? 0
        event.waitUntil?.(alertPlatformAdmins(`New interest: ${name ?? email}`, `${name ?? '(no name)'} <${email}>${business ? `\n${business}` : ''}\n\n${n} people on the list now. See them in Admin → Dashboard.`).catch(() => {}))
    }
    return { ok: true }
})

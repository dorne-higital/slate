import { and, eq, gt, isNotNull, isNull, lt } from 'drizzle-orm'
import type { H3Event } from 'h3'

type Site = typeof schema.sites.$inferSelect

/** Who hears about a site's form replies: its reply email, or else whoever pays for it / its first owner. */
async function siteContact(site: Site) {
    if (site.replyEmail) return site.replyEmail
    const db = useDb()
    const userId = site.billingUserId ?? (await db.query.siteMembers.findFirst({ where: and(eq(schema.siteMembers.siteId, site.id), eq(schema.siteMembers.role, 'owner')) }))?.userId
    if (!userId) return null
    return (await db.query.user.findFirst({ where: eq(schema.user.id, userId), columns: { email: true } }))?.email ?? null
}

export function notifyFormReply(event: H3Event, site: Site, form: { id: string, name: string, fields: FormField[] }, data: Record<string, string>, page: string | null, replyId: string) {
    // Webhooks, Slack, Discord and email lists, if the site has any and its plan includes them
    if (site.connections && Object.keys(site.connections).length) {
        event.waitUntil?.((async () => {
            if (!connectionsAllowed((await payerLimits(site)).limits)) return
            await sendReplyToConnections({ site, form, data, page, replyId, address: await liveAddress(site), sentAt: new Date() })
        })().catch(() => {}))
    }
    const work = (async () => {
        const to = await siteContact(site)
        if (!to) return
        const emailField = form.fields.find(f => f.kind === 'email')
        const visitorEmail = emailField ? data[emailField.label] : undefined
        await sendEmail({
            to,
            fromName: `${site.name} via Slate`,
            replyTo: visitorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail) ? visitorEmail : undefined,
            subject: `New reply to ${form.name}`,
            text: `Someone sent your ${form.name} form${page ? ` on ${page}` : ''}.${visitorEmail ? ' Reply to this email to answer them.' : ''}`,
            rows: Object.entries(data),
            button: { label: 'Open in Slate', url: appUrl(`/sites/${site.id}/forms?reply=${replyId}`) }
        })
    })()
    event.waitUntil?.(work)
}

export async function sendInviteEmail(to: string, siteName: string, inviterName: string, role: SiteRole, url: string) {
    return sendEmail({
        to,
        subject: `${inviterName} invited you to ${siteName} on Slate`,
        text: `${inviterName} has invited you to work on ${siteName} as ${role === 'admin' || role === 'owner' ? 'an' : 'a'} ${ROLE_INFO[role].name.toLowerCase()}: ${ROLE_INFO[role].can.toLowerCase()}.\n\nThe link works once and lasts 14 days.`,
        button: { label: `Join ${siteName}`, url }
    })
}

export async function sendPasswordResetEmail(to: string, name: string, url: string) {
    return sendEmail({
        to,
        subject: 'Reset your Slate password',
        text: `Hi ${name.split(' ')[0]},\n\nSomeone asked to reset the password for your Slate account. If it was you, press the button below. The link lasts an hour.\n\nIf it wasn’t you, ignore this email. Your password stays the same.`,
        button: { label: 'Choose a new password', url }
    })
}

/** Tells every platform admin about something that needs a person (e.g. a paid domain that didn't set up). */
export async function alertPlatformAdmins(subject: string, text: string) {
    const admins = await useDb().select({ email: schema.user.email }).from(schema.user).where(eq(schema.user.isPlatformAdmin, true))
    if (admins.length) await sendEmail({ to: admins.map(a => a.email), subject: `[Slate] ${subject}`, text })
}

/** Daily: remind people whose free trial ends in the next 3 days (once each). */
export async function sendTrialReminders() {
    const db = useDb()
    const soon = new Date(Date.now() + 3 * 24 * 3600 * 1000)
    const due = await db.select({ userId: schema.billingAccounts.userId, trialEndsAt: schema.billingAccounts.trialEndsAt, email: schema.user.email, name: schema.user.name, isAdmin: schema.user.isPlatformAdmin })
        .from(schema.billingAccounts)
        .innerJoin(schema.user, eq(schema.user.id, schema.billingAccounts.userId))
        .where(and(isNotNull(schema.billingAccounts.trialEndsAt), gt(schema.billingAccounts.trialEndsAt, new Date()), lt(schema.billingAccounts.trialEndsAt, soon), isNull(schema.billingAccounts.stripeSubscriptionId), isNull(schema.billingAccounts.trialReminderSentAt)))
    let sent = 0
    for (const d of due) {
        if (d.isAdmin) continue
        const site = await db.query.sites.findFirst({ where: and(eq(schema.sites.billingUserId, d.userId), isNull(schema.sites.deletedAt)) })
        if (!site) continue
        const days = Math.max(1, Math.ceil((d.trialEndsAt!.getTime() - Date.now()) / 86400000))
        await sendEmail({
            to: d.email,
            subject: `Your Slate trial ends in ${days} ${days === 1 ? 'day' : 'days'}`,
            text: `Hi ${d.name.split(' ')[0]},\n\nYour free trial of Slate ends on ${d.trialEndsAt!.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}. Choose a plan before then to keep ${site.name} online. Plans start at ${formatPence(PLANS[0]!.monthly)} a month.\n\nIf you don’t choose one, your site is paused, not deleted, and you can come back any time.`,
            button: { label: 'Choose a plan', url: appUrl(`/sites/${site.id}/billing`) }
        })
        await db.update(schema.billingAccounts).set({ trialReminderSentAt: new Date() }).where(eq(schema.billingAccounts.userId, d.userId))
        sent++
    }
    return sent
}

export async function sendVerifyEmail(to: string, name: string, url: string) {
    return sendEmail({
        to,
        subject: 'Confirm your email for Slate',
        text: `Hi ${name.split(' ')[0]},\n\nPlease confirm this is your email address. It keeps your account safe and lets you invite people to your site. The link lasts 3 days.\n\nIf you didn’t sign up for Slate, ignore this email.`,
        button: { label: 'Confirm my email', url }
    })
}

/** A one-off invoice from Slate, with the Stripe pay page. */
export async function sendInvoiceEmail(to: { name: string, email: string }, siteName: string, inv: typeof schema.customInvoices.$inferSelect) {
    if (!inv.hostedUrl) return false
    const due = inv.dueAt ? ` It’s due by ${inv.dueAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.` : ''
    return sendEmail({
        to: to.email,
        subject: `Invoice ${inv.number ?? ''} for ${siteName}: ${formatPence(inv.total)}`.replace('  ', ' '),
        text: `Hi ${to.name.split(' ')[0]},\n\nHere’s an invoice for ${formatPence(inv.total)} for ${siteName}: ${inv.description}.${due}\n\nYou can pay by card, and download a PDF, from the link below.`,
        button: { label: 'View and pay', url: inv.hostedUrl }
    })
}

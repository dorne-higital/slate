import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import type { TicketCategory, TicketSeverity } from '../shared/utils/supportTypes'
import type { Block, MenuItem, MenuSlot, PageStatus, ProjectMeta, SiteConnections, SiteIntegrations, SiteRole, SiteSeo, SiteSocials, SiteTheme } from '../shared/types'
import type { DomainOrderStatus } from '../shared/utils/domainPrices'
import type { FormField } from '../shared/utils/forms'

// ── Better Auth tables (shape required by better-auth's drizzle adapter) ──

export const user = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    // Never settable from the app. Promote someone with a manual SQL UPDATE.
    isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const session = pgTable('session', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const account = pgTable('account', {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const verification = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

// ── Slate tables. Every row belongs to one site; site_members is the only grant of access. ──

export const sites = pgTable('sites', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    customDomain: text('custom_domain').unique(),
    theme: jsonb('theme').$type<SiteTheme>(),
    seo: jsonb('seo').$type<SiteSeo>(),
    integrations: jsonb('integrations').$type<SiteIntegrations>(),
    socials: jsonb('socials').$type<SiteSocials>(),
    // Webhook addresses and API keys for integrations. Server-only: never sent to visitors or shown in full
    connections: jsonb('connections').$type<SiteConnections>(),
    // Whose plan this site runs on. Null = no bill (Slate's own / sites from before billing)
    billingUserId: text('billing_user_id').references(() => user.id, { onDelete: 'set null' }),
    // Where form reply notifications go (used once email sending is set up)
    replyEmail: text('reply_email'),
    // Visitors see a holding page; everything stays saved
    offline: boolean('offline').notNull().default(false),
    // Deleted sites vanish at once and are purged after 30 days; a platform admin can restore before then
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const siteMembers = pgTable('site_members', {
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').$type<SiteRole>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    primaryKey({ columns: [t.siteId, t.userId] }),
    index('site_members_user_idx').on(t.userId)
])

export const pages = pgTable('pages', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    title: text('title').notNull(),
    // Full path from the site root, e.g. "/" or "/services/sofas"
    path: text('path').notNull(),
    position: integer('position').notNull().default(0),
    status: text('status').$type<PageStatus>().notNull().default('draft'),
    // What the editor is working on…
    blocks: jsonb('blocks').$type<Block[]>().notNull().default([]),
    // …and what visitors see. Publishing copies blocks → publishedBlocks.
    publishedBlocks: jsonb('published_blocks').$type<Block[]>(),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    shareImage: text('share_image'),
    noIndex: boolean('no_index').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    // 'page', or 'project' (a portfolio item shown by the Projects block, at /work/…)
    kind: text('kind').$type<'page' | 'project'>().notNull().default('page'),
    project: jsonb('project').$type<ProjectMeta>(),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    uniqueIndex('pages_site_path_idx').on(t.siteId, t.path)
])

// One menu per slot per site: header, footer, legal (footer small print)
export const menus = pgTable('menus', {
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    slot: text('slot').$type<MenuSlot>().notNull(),
    items: jsonb('items').$type<MenuItem[]>().notNull().default([]),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    primaryKey({ columns: [t.siteId, t.slot] })
])

// Domains a client has connected (Cloudflare for SaaS custom hostnames).
// The site's main domain is sites.custom_domain; any other domain here redirects to it.
export const domains = pgTable('domains', {
    hostname: text('hostname').primaryKey(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    cloudflareId: text('cloudflare_id'),
    // pending: waiting for the client's DNS record · active: live with HTTPS · error: Cloudflare reported a problem
    status: text('status').$type<'pending' | 'active' | 'error'>().notNull().default('pending'),
    statusDetail: text('status_detail'),
    // Cloudflare's TXT ownership record, while it still needs one (bare domains whose provider flattens the CNAME)
    verifyName: text('verify_name'),
    verifyValue: text('verify_value'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    checkedAt: timestamp('checked_at', { withTimezone: true })
}, t => [
    index('domains_site_idx').on(t.siteId)
])

// Forms a site's visitors can fill in. Placed on pages with the Form block.
export const forms = pgTable('forms', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    fields: jsonb('fields').$type<FormField[]>().notNull().default([]),
    submitLabel: text('submit_label').notNull().default('Send'),
    successMessage: text('success_message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    index('forms_site_idx').on(t.siteId)
])

// What visitors sent. `data` is keyed by field label, as it was when they sent it.
export const formReplies = pgTable('form_replies', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    formId: uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
    data: jsonb('data').$type<Record<string, string>>().notNull(),
    pagePath: text('page_path'),
    readAt: timestamp('read_at', { withTimezone: true }),
    doneAt: timestamp('done_at', { withTimezone: true }),
    note: text('note'),
    // Salted hash of the sender's IP, only for rate limiting. Never shown.
    senderHash: text('sender_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    index('form_replies_form_idx').on(t.formId, t.createdAt),
    index('form_replies_site_idx').on(t.siteId, t.createdAt)
])

// Blog. A post is live once status is 'published' and publishedAt has passed,
// so scheduling a post is just publishing it with a future date.
export const postCategories = pgTable('post_categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    uniqueIndex('post_categories_site_slug_idx').on(t.siteId, t.slug)
])

export const posts = pgTable('posts', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => postCategories.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    excerpt: text('excerpt'),
    coverImage: text('cover_image'),
    // Plain text: blank lines between paragraphs, "## " headings, "- " list items. Never HTML.
    body: text('body').notNull().default(''),
    status: text('status').$type<PageStatus>().notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    uniqueIndex('posts_site_slug_idx').on(t.siteId, t.slug),
    index('posts_site_published_idx').on(t.siteId, t.publishedAt)
])

// Invitation links. Whoever opens the link (signed in) joins the site with this role.
export const invites = pgTable('invites', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    role: text('role').$type<SiteRole>().notNull(),
    // Optional: who it's for, so the People list can say so
    label: text('label'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    acceptedBy: text('accepted_by').references(() => user.id, { onDelete: 'set null' })
}, t => [
    index('invites_site_idx').on(t.siteId)
])

// Media library: files uploaded to R2 (key = "{siteId}/{id}.{ext}"), served at /media/{key}
export const media = pgTable('media', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    key: text('key').notNull().unique(),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    width: integer('width'),
    height: integer('height'),
    alt: text('alt'),
    uploadedBy: text('uploaded_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    index('media_site_idx').on(t.siteId, t.createdAt)
])

// One per paying person. A Studio plan covers several sites (sites.billing_user_id).
export const billingAccounts = pgTable('billing_accounts', {
    userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    plan: text('plan'),
    interval: text('interval'),
    // Stripe subscription status: active, trialing, past_due, canceled, unpaid, incomplete…
    status: text('status'),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    trialReminderSentAt: timestamp('trial_reminder_sent_at', { withTimezone: true }),
    stripeCustomerId: text('stripe_customer_id').unique(),
    stripeSubscriptionId: text('stripe_subscription_id'),
    // A special price set by a platform admin (e.g. a client moving over at what they paid before).
    // Pence per interval, on the plan's own Stripe product; used at checkout and swapped onto live subscriptions.
    customPriceId: text('custom_price_id'),
    customPlan: text('custom_plan'),
    customInterval: text('custom_interval'),
    customAmount: integer('custom_amount'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

// One-off invoices a platform admin sends for extra work (Stripe invoices with a pay link).
export const customInvoices = pgTable('custom_invoices', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id').references(() => sites.id, { onDelete: 'set null' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    stripeInvoiceId: text('stripe_invoice_id').notNull().unique(),
    number: text('number'),
    description: text('description').notNull(),
    // Pence
    total: integer('total').notNull(),
    // Stripe's: open, paid, void, uncollectible
    status: text('status').notNull(),
    hostedUrl: text('hosted_url'),
    pdfUrl: text('pdf_url'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

// Domains bought through Slate. Paid for yearly by a Stripe subscription; registered at name.com.
export const domainOrders = pgTable('domain_orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id').references(() => sites.id, { onDelete: 'set null' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    domainName: text('domain_name').notNull(),
    // Pence a year, fixed at purchase
    price: integer('price').notNull(),
    status: text('status').$type<DomainOrderStatus>().notNull().default('pending_payment'),
    // True when Stripe was in test mode: nothing was bought from name.com
    simulated: boolean('simulated').notNull().default(true),
    // The domain's own Cloudflare zone, once its DNS has moved there from name.com
    cloudflareZoneId: text('cloudflare_zone_id'),
    stripeSessionId: text('stripe_session_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    index('domain_orders_site_idx').on(t.siteId),
    index('domain_orders_name_idx').on(t.domainName)
])

// Support: a site's people open tickets; platform admins answer them as "Slate"
export const supportTickets = pgTable('support_tickets', {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    openedBy: text('opened_by').references(() => user.id, { onDelete: 'set null' }),
    subject: text('subject').notNull(),
    // open: waiting on Slate · answered: waiting on the customer · closed
    status: text('status').$type<'open' | 'answered' | 'closed'>().notNull().default('open'),
    // What kind of request (supportTypes.ts) and, for bugs, how bad: p1 (down) to p3 (minor). Answers to the form's questions in details.
    category: text('category').$type<TicketCategory>().notNull().default('help'),
    severity: text('severity').$type<TicketSeverity>(),
    details: jsonb('details').$type<Record<string, string>>(),
    // When someone on the site last opened it: Slate replies after this show as new
    customerSeenAt: timestamp('customer_seen_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    index('support_tickets_site_idx').on(t.siteId, t.updatedAt),
    index('support_tickets_status_idx').on(t.status, t.updatedAt)
])

export const supportMessages = pgTable('support_messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    fromSlate: boolean('from_slate').notNull().default(false),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [
    index('support_messages_ticket_idx').on(t.ticketId, t.createdAt)
])

// Server errors (5xx), for the platform admin Errors page and alert emails. Kept 30 days.
export const errorLogs = pgTable('error_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    // Groups repeats of the same error: hash of message + where it came from
    fingerprint: text('fingerprint').notNull(),
    message: text('message').notNull(),
    stack: text('stack'),
    status: integer('status').notNull(),
    method: text('method'),
    // Path only, never the query string (it can hold tokens)
    path: text('path'),
    host: text('host'),
    userId: text('user_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('error_logs_created_idx').on(t.createdAt), index('error_logs_fingerprint_idx').on(t.fingerprint, t.createdAt)])

// People who registered interest on the coming-soon page
export const interestSignups = pgTable('interest_signups', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name'),
    business: text('business'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

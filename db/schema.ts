import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import type { Block, MenuItem, MenuSlot, PageStatus, SiteRole, SiteSeo, SiteTheme } from '../shared/types'
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

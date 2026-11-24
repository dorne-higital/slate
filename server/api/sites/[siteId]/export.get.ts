import { asc, eq } from 'drizzle-orm'
import { strToU8, zipSync, type Zippable } from 'fflate'

/** Up to this much media goes into the zip itself; beyond it, files are listed with their addresses. */
const MEDIA_IN_ZIP_BYTES = 60 * 1024 * 1024

/**
 * Everything in a site as one zip: pages, posts, menus, theme and settings (site.json),
 * each page and post as readable text, form replies as CSV, and uploaded images and files.
 * Owners and admins only, since it includes every form reply.
 */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const db = useDb()
    const [pages, posts, categories, menus, forms, replies, media] = await Promise.all([
        db.select().from(schema.pages).where(eq(schema.pages.siteId, site.id)).orderBy(asc(schema.pages.position)),
        db.select().from(schema.posts).where(eq(schema.posts.siteId, site.id)),
        db.select().from(schema.postCategories).where(eq(schema.postCategories.siteId, site.id)),
        db.select().from(schema.menus).where(eq(schema.menus.siteId, site.id)),
        db.select().from(schema.forms).where(eq(schema.forms.siteId, site.id)),
        db.select().from(schema.formReplies).where(eq(schema.formReplies.siteId, site.id)).orderBy(asc(schema.formReplies.createdAt)),
        db.select().from(schema.media).where(eq(schema.media.siteId, site.id))
    ])
    const address = await liveAddress(site)
    const base = `https://${address}`

    const data = {
        exportedAt: new Date().toISOString(),
        site: { name: site.name, address, freeAddress: `${site.slug}.${useRuntimeConfig().public.sitesDomain}`, theme: site.theme, seo: site.seo, integrations: site.integrations },
        pages: pages.map(p => ({ title: p.title, path: p.path, status: p.status, seoTitle: p.seoTitle, seoDescription: p.seoDescription, live: p.publishedBlocks, draft: p.blocks })),
        posts: posts.map(p => ({ title: p.title, slug: p.slug, status: p.status, publishedAt: p.publishedAt, excerpt: p.excerpt, coverImage: p.coverImage, category: categories.find(c => c.id === p.categoryId)?.name ?? null, body: p.body })),
        categories: categories.map(c => ({ name: c.name, slug: c.slug })),
        menus: menus.map(m => ({ slot: m.slot, items: m.items })),
        forms: forms.map(f => ({ name: f.name, fields: f.fields, replies: replies.filter(r => r.formId === f.id).length })),
        media: media.map(m => ({ filename: m.filename, url: `${base}${mediaUrl(m.key)}`, alt: m.alt, type: m.contentType }))
    }

    const files: Zippable = {
        'site.json': strToU8(JSON.stringify(data, null, 2)),
        'README.txt': strToU8(`${site.name}: export from Slate on ${new Date().toLocaleString('en-GB')}\r\n\r\nsite.json: everything, for moving to another system\r\npages/ and posts/: each one as text\r\nform-replies/: one spreadsheet (CSV) per form\r\nmedia/: your uploaded images and files\r\n`)
    }
    const used = new Set<string>()
    const unique = (name: string) => {
        let n = name
        for (let i = 2; used.has(n); i++) n = name.replace(/(\.[^.]+)?$/, `-${i}$1`)
        used.add(n)
        return n
    }
    for (const p of pages) {
        files[unique(`pages/${p.path === '/' ? 'home' : slugify(p.path.replace(/\//g, ' ')) || 'page'}.txt`)] = strToU8(pageText(p.title, p.path, p.publishedBlocks ?? p.blocks ?? []))
    }
    for (const p of posts) {
        files[unique(`posts/${p.slug}.txt`)] = strToU8(`${p.title}\r\n${'='.repeat(Math.min(p.title.length, 80))}\r\n${p.publishedAt ? `Published ${p.publishedAt.toISOString().slice(0, 10)}\r\n` : 'Draft\r\n'}\r\n${p.body}\r\n`)
    }
    for (const f of forms) {
        files[unique(`form-replies/${slugify(f.name) || 'form'}.csv`)] = strToU8(repliesCsv(f, replies.filter(r => r.formId === f.id)))
    }

    let total = 0
    const skipped: string[] = []
    const storage = useMediaStorage()
    for (const m of media) {
        if (total + m.size > MEDIA_IN_ZIP_BYTES) {
            skipped.push(`${m.filename}  ${base}${mediaUrl(m.key)}`)
            continue
        }
        const raw = await storage.getItemRaw<Uint8Array | ArrayBuffer>(m.key)
        if (!raw) continue
        total += m.size
        // Images are already compressed, so store them as they are
        files[unique(`media/${m.filename}`)] = [raw instanceof Uint8Array ? raw : new Uint8Array(raw), { level: 0 }]
    }
    if (skipped.length) files['media/MORE-FILES.txt'] = strToU8(`These files were too many to fit in one download. Each one can be saved from its address:\r\n\r\n${skipped.join('\r\n')}\r\n`)

    const zip = zipSync(files, { level: 6 })
    const date = new Date().toISOString().slice(0, 10)
    setResponseHeaders(event, {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="${slugify(site.name) || 'site'}-export-${date}.zip"`,
        'cache-control': 'no-store'
    })
    return zip
})

/** A page's words in reading order, block by block. */
function pageText(title: string, path: string, blocks: Block[]) {
    const out = [title, '='.repeat(Math.min(title.length, 80)), path, '']
    for (const b of blocks) {
        const def = findBlockType(b.type)
        out.push(`[${def?.name ?? b.type}]`)
        for (const f of def?.fields ?? []) {
            const v = b.props[f.key]
            if (typeof v === 'string' && v.trim() && f.kind !== 'form') out.push(`${f.label}: ${v}`)
        }
        const items = b.props.items as Record<string, string>[] | undefined
        for (const [i, item] of (items ?? []).entries()) {
            out.push(`  ${i + 1}. ${Object.values(item).filter(Boolean).join(' · ')}`)
        }
        out.push('')
    }
    return out.join('\r\n')
}

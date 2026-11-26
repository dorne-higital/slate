import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MARKETING_PAGES, marketingPage } from '../../shared/utils/marketing'
import { Client, TURNSTILE_TEST_TOKEN, cleanUp, makeAdmin, newAccount, sql } from './helpers'

afterAll(cleanUp)

// Needs a second server with coming soon switched on (see CLAUDE.md test notes)
const COMING_SOON = process.env.TEST_COMING_SOON_URL
if (!COMING_SOON) console.log('Skipping coming-soon tests: set TEST_COMING_SOON_URL to a server started with NUXT_PUBLIC_COMING_SOON=true')

describe.skipIf(!COMING_SOON)('coming soon', () => {
    it('keeps unreleased pages private', async () => {
        const visitor = new Client(undefined, COMING_SOON)
        const anon = await visitor.get('/pricing')
        expect(anon.status).toBe(302)
        expect(anon.text + JSON.stringify(anon)).not.toContain('Simple pricing with everything included')

        // Privacy and terms stay public, but without menus to pages that aren't out yet
        const privacy = await visitor.get('/privacy')
        expect(privacy.status).toBe(200)
        expect(privacy.text).not.toContain('href="/pricing"')

        // Sign-ups are closed while coming soon is on: make the account on the normal server, log in here
        const admin = await newAccount('mk-admin')
        await makeAdmin(admin.userId)
        const browser = new Client(undefined, COMING_SOON)
        const login = await browser.req('POST', '/api/auth/sign-in/email', { email: admin.email, password: 'correct-horse-battery' }, { 'x-turnstile-token': TURNSTILE_TEST_TOKEN })
        expect(login.status, login.text.slice(0, 200)).toBe(200)
        const seen = await browser.get('/pricing')
        expect(seen.status).toBe(200)
        expect(seen.text).toContain('Simple pricing with everything included')
    })
})

// Normal test server (coming soon off): every page of the site renders properly
const pageChecks = (paths: string[]) => async () => {
    const c = new Client()
    for (const path of paths) {
        const r = await c.get(path)
        expect(r.status, path).toBe(200)
        expect(r.text.match(/<h1[\s>]/g)?.length, `${path} has one h1`).toBe(1)
        expect(r.text, path).toContain(`<title>${escapeHtml(marketingPage(path).title)}</title>`)
        expect(r.text, path).toContain(`rel="canonical" href="https://slatecms.co.uk${path}"`)
    }
}
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

describe('marketing pages', () => {
    it('feature pages render with one h1 and their own title', pageChecks(MARKETING_PAGES.filter(p => p.section === 'features').map(p => p.path)))
    it('home, pricing and guides render with one h1 and their own title', pageChecks(['/', '/pricing', '/guides']))
    it('about, contact and legal pages render with one h1 and their own title', pageChecks(['/about', '/contact', '/privacy', '/terms']))
    it('comparison pages render with one h1 and their own title', pageChecks(MARKETING_PAGES.filter(p => p.section === 'compare').map(p => p.path)))
})

describe('sector pages', () => {
    it('render with one h1 and their own title', pageChecks(MARKETING_PAGES.filter(p => p.section === 'for').map(p => p.path)))
    it('unknown sectors are not found', async () => {
        expect((await new Client().get('/for/plumbers')).status).toBe(404)
    })
})

// Guides come from the marketing Slate site (NUXT_MARKETING_SITE_ID on the test server)
const GUIDES_SITE = process.env.TEST_MARKETING_SITE_ID
if (!GUIDES_SITE) console.log('Skipping guides tests: set TEST_MARKETING_SITE_ID to the NUXT_MARKETING_SITE_ID the test server uses')

describe.skipIf(!GUIDES_SITE)('guides', () => {
    const stamp = Date.now()
    const made: string[] = []
    let editor: Client
    const post = async (title: string, patch: Record<string, unknown>) => {
        const r = await editor.post(`/api/sites/${GUIDES_SITE}/posts`, { title })
        expect(r.status, r.text.slice(0, 200)).toBe(200)
        made.push(r.json.id)
        const p = await editor.patch(`/api/sites/${GUIDES_SITE}/posts/${r.json.id}`, { body: 'First paragraph.\n\n## A heading\n\nMore words.', ...patch })
        expect(p.status, p.text.slice(0, 200)).toBe(200)
        return p.json.slug as string
    }

    beforeAll(async () => {
        const admin = await newAccount('guides-admin')
        await makeAdmin(admin.userId)
        editor = admin.client
    })
    afterAll(async () => {
        for (const id of made) await editor.del(`/api/sites/${GUIDES_SITE}/posts/${id}`)
    })

    it('lists published guides and shows each at /guides/<slug>', async () => {
        const slug = await post(`Live guide ${stamp}`, { status: 'published' })
        const list = await new Client().get('/api/marketing/guides')
        expect(list.status).toBe(200)
        expect(list.json.guides.some((g: { slug: string }) => g.slug === slug)).toBe(true)
        const page = await new Client().get(`/guides/${slug}`)
        expect(page.status).toBe(200)
        expect(page.text).toContain(`Live guide ${stamp}`)
        expect(page.text).toContain('"@type":"Article"')
    })

    it('hides drafts and guides scheduled for later', async () => {
        const draft = await post(`Draft guide ${stamp}`, { status: 'draft' })
        const later = await post(`Later guide ${stamp}`, { status: 'published', publishedAt: new Date(Date.now() + 86400000).toISOString() })
        expect((await new Client().get(`/api/marketing/guides/${draft}`)).status).toBe(404)
        expect((await new Client().get(`/api/marketing/guides/${later}`)).status).toBe(404)
        expect((await new Client().get(`/guides/${draft}`)).status).toBe(404)
        expect((await new Client().get('/api/marketing/guides/no-such-guide')).status).toBe(404)
    })
})

describe.skipIf(!GUIDES_SITE)('contact form', () => {
    type Field = { id: string, label: string, kind: string }
    let fields: Field[] = []
    const answers = (over: Record<string, string> = {}) => Object.fromEntries(fields.map(f => [f.id, over[f.label] ?? (f.kind === 'email' ? 'someone@example.com' : `Test ${f.label}`)]))
    const send = (c: Client, body: Record<string, unknown>) => c.post('/api/marketing/contact', { startedAt: Date.now() - 10_000, turnstile: TURNSTILE_TEST_TOKEN, ...body })
    const replies = async () => (await sql`select count(*)::int n from form_replies where site_id = ${GUIDES_SITE}`)[0]!.n as number

    beforeAll(async () => {
        const r = await new Client().get('/api/marketing/contact')
        expect(r.status).toBe(200)
        fields = r.json.fields
        expect(fields.map(f => f.kind)).toEqual(expect.arrayContaining(['email', 'textarea']))
    })
    afterAll(async () => {
        await sql`delete from form_replies where site_id = ${GUIDES_SITE} and data::text like '%Test Message%'`
    })

    it('stores a message in the guides site inbox', async () => {
        const before = await replies()
        const r = await send(new Client(), { answers: answers() })
        expect(r.status, r.text.slice(0, 200)).toBe(200)
        expect(await replies()).toBe(before + 1)
    })

    it('says which field is wrong', async () => {
        const email = fields.find(f => f.kind === 'email')!
        const r = await send(new Client(), { answers: answers({ [email.label]: '' }) })
        expect(r.status).toBe(400)
        expect(r.json.data.fieldId).toBe(email.id)
    })

    it('quietly drops bots', async () => {
        const before = await replies()
        expect((await send(new Client(), { answers: answers(), website: 'http://spam.example' })).status).toBe(200)
        expect(await replies()).toBe(before)
    })

    it('needs the bot check', async () => {
        expect((await send(new Client(), { answers: answers(), turnstile: '' })).status).toBe(400)
    })

    it('limits repeated messages from one sender', async () => {
        const c = new Client()
        const statuses: number[] = []
        for (let i = 0; i < 6; i++) statuses.push((await send(c, { answers: answers() })).status)
        expect(statuses).toContain(429)
    })
})

describe('sitemap', () => {
    const locs = (xml: string) => [...xml.matchAll(/<loc>https:\/\/[^/<]+([^<]*)<\/loc>/g)].map(m => m[1] || '/')

    it('lists every marketing page and live guide once launched', async () => {
        const r = await new Client().get('/sitemap.xml')
        expect(r.status).toBe(200)
        const paths = locs(r.text)
        for (const p of MARKETING_PAGES) expect(paths, p.path).toContain(p.path)
        if (GUIDES_SITE) {
            const [guide] = await sql`select slug from posts where site_id = ${GUIDES_SITE} and status = 'published' and published_at <= now() limit 1`
            if (guide) expect(paths).toContain(`/guides/${guide.slug}`)
        }
        expect(r.text).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
    })

    it.skipIf(!COMING_SOON)('lists only the home page while coming soon', async () => {
        const r = await new Client(undefined, COMING_SOON).get('/sitemap.xml')
        expect(locs(r.text)).toEqual(['/'])
    })
})

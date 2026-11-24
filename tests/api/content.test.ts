import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Client, cleanUp, newAccount } from './helpers'

let ana: Awaited<ReturnType<typeof newAccount>>
let visitor: Client
let homeId: string
beforeAll(async () => {
    ana = await newAccount('content')
    const site = await ana.client.get(`/api/sites/${ana.siteId}`)
    visitor = new Client(`${site.json.slug}.${new URL(process.env.TEST_BASE_URL ?? 'http://localhost:3001').host}`)
    const pages = await ana.client.get(`/api/sites/${ana.siteId}/pages`)
    homeId = pages.json.find((p: { path: string }) => p.path === '/').id
})
afterAll(cleanUp)

describe('pages', () => {
    it('cleans what’s saved and only shows it once published', async () => {
        const saved = await ana.client.patch(`/api/sites/${ana.siteId}/pages/${homeId}`, {
            blocks: [
                { id: 'h', type: 'hero', props: { heading: 'Draft heading', buttonUrl: 'javascript:alert(1)' } },
                { id: 'x', type: 'not-a-block', props: {} }
            ]
        })
        expect(saved.status).toBe(200)
        expect(saved.json.blocks).toHaveLength(1)
        expect(saved.json.blocks[0].props.buttonUrl).toBe('')
        expect((await visitor.get('/')).text).not.toContain('Draft heading')
        expect((await ana.client.post(`/api/sites/${ana.siteId}/pages/${homeId}/publish`)).status).toBe(200)
        const live = await visitor.get('/')
        expect(live.status).toBe(200)
        expect(live.text).toContain('Draft heading')
        expect(live.text).not.toContain('javascript:alert')
    })
    it('escapes text instead of running it', async () => {
        await ana.client.patch(`/api/sites/${ana.siteId}/pages/${homeId}`, { blocks: [{ id: 't', type: 'text', props: { heading: '<script>alert(1)</script>', body: '<img src=x onerror=alert(1)>' } }] })
        await ana.client.post(`/api/sites/${ana.siteId}/pages/${homeId}/publish`)
        const live = await visitor.get('/')
        expect(live.text).not.toContain('<script>alert(1)</script>')
        expect(live.text).not.toContain('<img src=x onerror')
    })
    it('makes, finds and deletes a page, but never the home page', async () => {
        const made = await ana.client.post(`/api/sites/${ana.siteId}/pages`, { title: 'Prices' })
        expect(made.status).toBe(200)
        expect((await ana.client.del(`/api/sites/${ana.siteId}/pages/${made.json.id}`)).status).toBe(200)
        expect((await ana.client.del(`/api/sites/${ana.siteId}/pages/${homeId}`)).status).toBe(400)
    })
    it('shows a 404 for a page that doesn’t exist', async () => {
        expect((await visitor.get('/no-such-page')).status).toBe(404)
    })
})

describe('projects', () => {
    it('makes a project page at /work/… that stays out of the Pages list', async () => {
        const p = await ana.client.post(`/api/sites/${ana.siteId}/projects`, { title: 'Test Project' })
        expect(p.status).toBe(200)
        expect(p.json.path).toBe('/work/test-project')
        const upd = await ana.client.patch(`/api/sites/${ana.siteId}/projects/${p.json.id}`, { project: { category: 'New build', cover: 'javascript:x', links: [{ label: 'Live', url: 'example.com' }] } })
        expect(upd.json.project.cover).toBe('')
        expect(upd.json.project.links[0].url).toBe('https://example.com')
        const pages = await ana.client.get(`/api/sites/${ana.siteId}/pages`)
        expect(pages.json.some((x: { id: string }) => x.id === p.json.id)).toBe(false)
        await ana.client.post(`/api/sites/${ana.siteId}/pages/${p.json.id}/publish`)
        const live = await visitor.get('/work/test-project')
        expect(live.status).toBe(200)
        expect(live.text).toContain('Test Project')
        expect(live.text).toContain('https://example.com')
    })
})

describe('theme', () => {
    it('accepts any Google Font and works out its stylesheet itself', async () => {
        const r = await ana.client.put(`/api/sites/${ana.siteId}/theme`, { headingFont: 'Baloo 2', bodyFont: 'Not A Font', headingFontCss: 'Evil&x=1' })
        expect(r.status).toBe(200)
        expect(r.json.headingFontCss).toBe('Baloo+2:wght@400;500;600;700;800')
        expect(r.json.bodyFont).toBeUndefined()
    })
})

describe('multi-step forms', () => {
    it('saves step breaks and takes a reply from every step', async () => {
        const made = await ana.client.post(`/api/sites/${ana.siteId}/forms`, { name: 'Steps', fields: [
            { label: 'About you', kind: 'step' }, { label: 'Name', kind: 'text', required: true },
            { label: 'Your project', kind: 'step' }, { label: 'Details', kind: 'textarea', required: true }
        ] })
        expect(made.status).toBe(200)
        expect(made.json.fields.map((f: { kind: string }) => f.kind)).toEqual(['step', 'text', 'step', 'textarea'])
        const [, name, , details] = made.json.fields
        const missing = await visitor.post(`/api/public/forms/${made.json.id}`, { answers: { [name.id]: 'Dan' }, startedAt: Date.now() - 10_000 })
        expect(missing.status).toBe(400)
        expect(missing.json.data.fieldId).toBe(details.id)
        const ok = await visitor.post(`/api/public/forms/${made.json.id}`, { answers: { [name.id]: 'Dan', [details.id]: 'A new site' }, startedAt: Date.now() - 10_000 })
        expect(ok.status).toBe(200)
        const replies = await ana.client.get(`/api/sites/${ana.siteId}/forms/${made.json.id}/replies`)
        expect(JSON.stringify(replies.json)).toContain('A new site')
        expect(JSON.stringify(replies.json)).not.toContain('About you')
    })
})

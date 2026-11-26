import { describe, expect, it } from 'vitest'
import { Client } from './helpers'

const COMING_SOON = process.env.TEST_COMING_SOON_URL

describe('help centre', () => {
    it('lists the areas and shows an article with HowTo data', async () => {
        const c = new Client()
        const list = await c.get('/help')
        expect(list.status).toBe(200)
        expect(list.text.match(/<h1[\s>]/g)?.length).toBe(1)
        expect(list.text).toContain('href="/help/add-a-page"')
        const article = await c.get('/help/add-a-page')
        expect(article.status).toBe(200)
        expect(article.text.match(/<h1[\s>]/g)?.length).toBe(1)
        expect(article.text).toContain('"@type":"HowTo"')
        expect(article.text).toContain('rel="canonical" href="https://slatecms.co.uk/help/add-a-page"')
    })

    it('unknown articles are not found', async () => {
        const c = new Client()
        expect((await c.get('/help/nope')).status).toBe(404)
        expect((await c.get('/api/help/nope')).status).toBe(404)
    })

    it('lists articles in the sitemap after launch', async () => {
        expect((await new Client().get('/sitemap.xml')).text).toContain('/help/add-a-page</loc>')
    })

    it.skipIf(!COMING_SOON)('is open before launch, without links to unreleased pages', async () => {
        const c = new Client(undefined, COMING_SOON)
        for (const path of ['/help', '/help/add-a-page']) {
            const r = await c.get(path)
            expect(r.status, path).toBe(200)
            expect(r.text, path).not.toContain('href="/pricing"')
        }
    })
})

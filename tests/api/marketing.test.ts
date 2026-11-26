import { afterAll, describe, expect, it } from 'vitest'
import { MARKETING_PAGES, marketingPage } from '../../shared/utils/marketing'
import { Client, TURNSTILE_TEST_TOKEN, cleanUp, makeAdmin, newAccount } from './helpers'

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
})

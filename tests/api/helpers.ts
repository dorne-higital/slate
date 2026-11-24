/**
 * Helpers for the API tests. They talk to a running dev server (TEST_BASE_URL, default http://localhost:3001)
 * started with Cloudflare's Turnstile test keys (yarn dev:test), and read/clean the dev database from .env.
 * Every account they make is test+…@example.com and is deleted afterwards. They refuse to run against the live database.
 */
import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ quiet: true })
export const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3001'
const dbUrl = process.env.NUXT_DATABASE_URL ?? ''
const prodUrl = process.env.PROD_DATABASE_URL_UNPOOLED ?? ''
const host = (u: string) => { try { return new URL(u).hostname.replace('-pooler', '') } catch { return '' } }
if (!dbUrl || (prodUrl && host(dbUrl) === host(prodUrl))) throw new Error('API tests only run against the dev database. Check NUXT_DATABASE_URL in .env.')
export const sql = neon(dbUrl)

export const TURNSTILE_TEST_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX'
const run = Date.now().toString(36)
let n = 0
export const testEmail = (label: string) => `test+${label}-${run}-${++n}@example.com`

/** A visitor with its own cookies. */
export class Client {
    cookies = new Map<string, string>()
    constructor(public hostHeader?: string) {}
    async req(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
        const res = await fetch(BASE + path, {
            method,
            redirect: 'manual',
            headers: {
                'content-type': 'application/json',
                'origin': BASE,
                ...(this.hostHeader ? { host: this.hostHeader } : {}),
                ...(this.cookies.size ? { cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
                ...headers
            },
            body: body === undefined ? undefined : JSON.stringify(body)
        })
        for (const c of res.headers.getSetCookie()) {
            const [pair] = c.split(';')
            const i = pair!.indexOf('=')
            this.cookies.set(pair!.slice(0, i), pair!.slice(i + 1))
        }
        const text = await res.text()
        let json: any = null
        try { json = JSON.parse(text) } catch { /* not JSON */ }
        return { status: res.status, json, text }
    }
    get = (p: string) => this.req('GET', p)
    post = (p: string, b?: unknown) => this.req('POST', p, b ?? {})
    patch = (p: string, b: unknown) => this.req('PATCH', p, b)
    put = (p: string, b: unknown) => this.req('PUT', p, b)
    del = (p: string, b?: unknown) => this.req('DELETE', p, b)
}

const made: string[] = []

/** Signs up a new person with their own site. */
export async function newAccount(label: string) {
    const c = new Client()
    const email = testEmail(label)
    const r = await c.post('/api/signup', { name: `Test ${label}`, email, password: 'correct-horse-battery', siteName: `Test ${label} ${run}`, layout: 'blank', turnstile: TURNSTILE_TEST_TOKEN })
    if (r.status !== 200) throw new Error(`Sign-up failed (${r.status}): ${r.text.slice(0, 200)}. Is the dev server running with yarn dev:test?`)
    made.push(email)
    const [{ id }] = await sql`select id from "user" where email = ${email}` as { id: string }[]
    return { client: c, email, userId: id, siteId: r.json.siteId as string }
}

export async function makeAdmin(userId: string) {
    await sql`update "user" set is_platform_admin = true where id = ${userId}`
}

/** Deletes every account (and its sites) made by this test run. */
export async function cleanUp() {
    for (const email of made.splice(0)) {
        const rows = await sql`select id from "user" where email = ${email}` as { id: string }[]
        for (const { id } of rows) {
            await sql`delete from sites where id in (select site_id from site_members where user_id = ${id})`
            await sql`delete from sites where billing_user_id = ${id}`
            await sql`delete from billing_accounts where user_id = ${id}`
            await sql`delete from "user" where id = ${id}`
        }
    }
}

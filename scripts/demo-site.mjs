// Builds "Bramble & Oak Upholstery", the made-up business shown in Slate's demo videos, on the LOCAL dev
// server and dev database. Signs up a demo account (or reuses it), draws its pictures with Chrome, and
// fills in pages, theme and form replies through Slate's own API. Safe to re-run: it rebuilds the content.
//
//   yarn dev:test (on :3002), then: node --env-file=.env scripts/demo-site.mjs
//
// The demo login is DEMO_EMAIL / DEMO_PASSWORD in .env (made up on first run, local only).
import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { neon } from '@neondatabase/serverless'

const BASE = process.env.DEMO_BASE_URL ?? 'http://localhost:3002'
if (!/localhost|127\.0\.0\.1/.test(BASE)) throw new Error('The demo site is only ever built locally')
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const TURNSTILE = 'XXXX.DUMMY.TOKEN.XXXX' // Cloudflare's test token: the test server accepts it
const sql = neon(process.env.NUXT_DATABASE_URL)

// ── Login ──
let email = process.env.DEMO_EMAIL
let password = process.env.DEMO_PASSWORD
if (!email || !password) {
    email = 'demo+bramble@example.com'
    password = `demo-${crypto.randomUUID()}`
    appendFileSync('.env', `\n# Local demo account for the marketing videos (scripts/demo-site.mjs)\nDEMO_EMAIL=${email}\nDEMO_PASSWORD=${password}\n`)
}
const cookies = new Map()
async function api(method, path, body, headers = {}) {
    const isForm = body instanceof FormData
    const res = await fetch(new URL(path, BASE), {
        method,
        headers: { origin: BASE, ...(isForm ? {} : { 'content-type': 'application/json' }), cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '), ...headers },
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body)
    })
    for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(';')
        const i = pair.indexOf('=')
        cookies.set(pair.slice(0, i), pair.slice(i + 1))
    }
    const text = await res.text()
    let json = null
    try { json = JSON.parse(text) } catch { /* not JSON */ }
    if (!res.ok) throw Object.assign(new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 200)}`), { status: res.status })
    return json
}

let siteId
try {
    await api('POST', '/api/auth/sign-in/email', { email, password }, { 'x-turnstile-token': TURNSTILE })
    ;[{ id: siteId }] = await sql`select s.id from sites s join site_members m on m.site_id = s.id join "user" u on u.id = m.user_id where u.email = ${email} and s.deleted_at is null order by s.created_at limit 1`
    console.log('Signed in as the demo account')
} catch {
    const r = await api('POST', '/api/signup', { name: 'Alex Bramble', email, password, siteName: 'Bramble & Oak Upholstery', layout: 'trade', country: 'GB', turnstile: TURNSTILE })
    siteId = r.siteId
    console.log('Made the demo account')
}

// The demo address is made up, so mark it confirmed (local dev database only) to keep the reminder out of the videos
await sql`update "user" set email_verified = true where email = ${email}`

// ── Pictures: drawn in the browser, so there's nothing to license ──
const out = resolve('.demo/images')
mkdirSync(out, { recursive: true })
const FABRICS = {
    sage: ['#8FA58F', '#7D937E'], ochre: ['#C9963F', '#B7852F'], rust: ['#A9573A', '#954A30'],
    navy: ['#2E3F5C', '#25344D'], linen: ['#E4DACB', '#D6CAB8'], plum: ['#6E4A5E', '#5E3D50']
}
const weave = (c) => `background-color:${c[0]};background-image:repeating-linear-gradient(0deg,${c[1]} 0 2px,transparent 2px 6px),repeating-linear-gradient(90deg,${c[1]}88 0 2px,transparent 2px 6px)`
const chair = (c, legs = '#5A4030') => `
<svg viewBox="0 0 400 360" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
  <defs><pattern id="w" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${c[0]}"/><path d="M0 4h8M4 0v8" stroke="${c[1]}" stroke-width="1.6"/></pattern></defs>
  <ellipse cx="200" cy="338" rx="160" ry="14" fill="#00000018"/>
  <rect x="88" y="290" width="14" height="46" rx="4" fill="${legs}"/><rect x="298" y="290" width="14" height="46" rx="4" fill="${legs}"/>
  <path d="M110 60 Q200 20 290 60 L300 220 L100 220 Z" fill="url(#w)" stroke="${c[1]}" stroke-width="3"/>
  <rect x="60" y="150" width="62" height="150" rx="28" fill="url(#w)" stroke="${c[1]}" stroke-width="3"/>
  <rect x="278" y="150" width="62" height="150" rx="28" fill="url(#w)" stroke="${c[1]}" stroke-width="3"/>
  <rect x="104" y="210" width="192" height="80" rx="18" fill="url(#w)" stroke="${c[1]}" stroke-width="3"/>
  <path d="M124 236 H276" stroke="${c[1]}" stroke-width="3" stroke-dasharray="6 6"/>
</svg>`
const sofa = (c) => `
<svg viewBox="0 0 600 320" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
  <defs><pattern id="w" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${c[0]}"/><path d="M0 4h8M4 0v8" stroke="${c[1]}" stroke-width="1.6"/></pattern></defs>
  <ellipse cx="300" cy="300" rx="260" ry="14" fill="#00000018"/>
  <rect x="80" y="262" width="14" height="34" rx="4" fill="#5A4030"/><rect x="506" y="262" width="14" height="34" rx="4" fill="#5A4030"/>
  <rect x="96" y="60" width="408" height="150" rx="30" fill="url(#w)" stroke="${c[1]}" stroke-width="3"/>
  <rect x="40" y="120" width="86" height="150" rx="34" fill="url(#w)" stroke="${c[1]}" stroke-width="3"/>
  <rect x="474" y="120" width="86" height="150" rx="34" fill="url(#w)" stroke="${c[1]}" stroke-width="3"/>
  <rect x="116" y="190" width="182" height="74" rx="18" fill="url(#w)" stroke="${c[1]}" stroke-width="3"/>
  <rect x="302" y="190" width="182" height="74" rx="18" fill="url(#w)" stroke="${c[1]}" stroke-width="3"/>
</svg>`
const scene = (bg, art, extra = '') => `<!doctype html><html><body style="margin:0;width:1200px;height:900px;display:flex;align-items:flex-end;justify-content:center;background:${bg};overflow:hidden">
<div style="position:absolute;inset:auto 0 0 0;height:230px;background:#00000010"></div>${extra}
<div style="width:760px;height:620px;margin-bottom:110px;position:relative">${art}</div></body></html>`
const worn = '<div style="position:absolute;inset:0;background:radial-gradient(circle at 40% 55%,#00000030 0 60px,transparent 120px),radial-gradient(circle at 65% 40%,#ffffff30 0 40px,transparent 90px);z-index:2"></div>'

const PICTURES = [
    ['hero', 'A sage green armchair, reupholstered by hand', scene('#F1EDE4', chair(FABRICS.sage))],
    ['sofa-ochre', 'A two-seater sofa in ochre wool', scene('#EFE6D8', sofa(FABRICS.ochre))],
    ['chair-rust', 'A wingback chair in rust velvet', scene('#F4ECE6', chair(FABRICS.rust))],
    ['chair-navy', 'A navy armchair with oak legs', scene('#E8EBEF', chair(FABRICS.navy, '#8A6A45'))],
    ['sofa-plum', 'A plum three-seater sofa', scene('#F2EBEF', sofa(FABRICS.plum))],
    ['before', 'An armchair before: faded and worn', scene('#E9E6E1', `<div style="filter:saturate(.35) brightness(.92);width:100%;height:100%">${chair(FABRICS.linen)}</div>`, worn)],
    ['after', 'The same armchair after: new sage fabric', scene('#F1EDE4', chair(FABRICS.sage))],
    ['swatches', 'Fabric swatches on the workbench', `<!doctype html><html><body style="margin:0;width:1200px;height:900px;background:#E9E1D3;display:grid;grid-template-columns:repeat(3,1fr);gap:36px;padding:90px;box-sizing:border-box">${Object.values(FABRICS).map(c => `<div style="${weave(c)};border-radius:10px;box-shadow:0 14px 30px #0002"></div>`).join('')}</body></html>`]
]
const uploaded = {}
const existing = await sql`select filename, key from media where site_id = ${siteId}`
for (const [name, alt, html] of PICTURES) {
    const had = existing.find(m => m.filename === `${name}.png`)
    if (had) {
        uploaded[name] = { url: `/media/${had.key}`, alt }
        continue
    }
    const htmlFile = join(out, `${name}.html`)
    const png = join(out, `${name}.png`)
    writeFileSync(htmlFile, html)
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1200,900', `--screenshot=${png}`, `file://${htmlFile}`], { stdio: 'ignore' })
    const fd = new FormData()
    fd.append('file', new Blob([readFileSync(png)], { type: 'image/png' }), `${name}.png`)
    fd.append('width', '1200')
    fd.append('height', '900')
    const m = await api('POST', `/api/sites/${siteId}/media`, fd)
    if (m.id) await api('PATCH', `/api/sites/${siteId}/media/${m.id}`, { alt }).catch(() => {})
    uploaded[name] = { url: m.url, alt }
}
console.log(`Pictures ready (${PICTURES.length - existing.length > 0 ? 'uploaded new ones' : 'reused'})`)

// ── Look ──
await api('PUT', `/api/sites/${siteId}/theme`, { primary: '#2F5D50', dark: '#23302C', soft: '#F1EDE4', text: '#4A544F', background: '#FFFFFF', headingFont: 'Fraunces', bodyFont: 'Schibsted Grotesk', corners: 'soft', footerColour: 'dark' })

// ── Start every recording from the same place ──
await sql`delete from redirects where site_id = ${siteId}`
await sql`update sites set integrations = '{}'::jsonb, seo = '{}'::jsonb where id = ${siteId}`
await sql`update pages set seo_description = null where site_id = ${siteId}`
await sql`delete from page_versions where site_id = ${siteId}`

// ── Pages ──
const id = () => crypto.randomUUID()
const pic = (n) => uploaded[n]
const pages = await api('GET', `/api/sites/${siteId}/pages`)
const byPath = Object.fromEntries(pages.map(p => [p.path, p]))
const form = (await sql`select id from forms where site_id = ${siteId} order by created_at limit 1`)[0]

const content = {
    '/': [
        { type: 'hero', props: { layout: 'split', eyebrow: 'Upholstery in Chester', heading: 'Chairs and sofas, reupholstered by hand', text: 'Bring a favourite piece back to life. Traditional methods, hundreds of fabrics, and a free quote within two days.', buttonLabel: 'Get a free quote', buttonUrl: '/get-a-quote', button2Label: 'See our work', button2Url: '/our-work', imageUrl: pic('hero').url, imageAlt: pic('hero').alt } },
        { type: 'services', props: { eyebrow: 'What we do', heading: 'From one chair to a whole room', intro: 'Every job starts with a visit to see the piece and talk fabrics.', columns: '3', items: [
            { title: 'Full reupholstery', text: 'Stripped back to the frame, rebuilt and recovered in the fabric you choose.' },
            { title: 'Re-covering', text: 'New fabric over sound padding, for pieces that just need a fresh look.' },
            { title: 'Repairs', text: 'Loose joints, sagging seats and tired springs, put right.' }
        ] } },
        { type: 'beforeAfter', props: { eyebrow: 'Before and after', heading: 'Same chair, new life', before: pic('before').url, after: pic('after').url, beforeLabel: 'Before', afterLabel: 'After' } },
        { type: 'reviews', props: { eyebrow: 'Reviews', heading: 'What customers say', items: [
            { quote: 'My gran’s armchair looks better than new. Clear quote, done when they said.', name: 'Priya', role: 'Hoole' },
            { quote: 'Brilliant help choosing a fabric that will survive two dogs.', name: 'Tom', role: 'Upton' },
            { quote: 'Collected, recovered and delivered back within three weeks.', name: 'Sarah', role: 'Saltney' }
        ] } },
        { type: 'cta', props: { eyebrow: 'Free quotes', heading: 'Got a piece that needs some love?', text: 'Send us a photo and we’ll come back with a price within two working days.', buttonLabel: 'Get a free quote', buttonUrl: '/get-a-quote', sectionBg: 'primary' } }
    ],
    '/services': [
        { type: 'hero', props: { layout: 'centred', eyebrow: 'Services', heading: 'Upholstery, done properly', text: 'Traditional and modern upholstery for homes and businesses across Chester.' } },
        { type: 'imageText', props: { imageSide: 'right', eyebrow: 'Fabrics', heading: 'Hundreds of fabrics to choose from', body: 'Bring your own, or choose from our sample books of wool, linen, velvet and hard-wearing weaves.', imageUrl: pic('swatches').url, imageAlt: pic('swatches').alt } }
    ],
    '/our-work': [
        { type: 'hero', props: { layout: 'centred', eyebrow: 'Our work', heading: 'Recent pieces', text: 'A few of the chairs and sofas that have left the workshop lately.' } },
        { type: 'gallery', props: { columns: '3', shape: 'square', items: ['sofa-ochre', 'chair-rust', 'chair-navy', 'sofa-plum', 'after', 'hero'].map(n => ({ url: pic(n).url, alt: pic(n).alt })) } }
    ]
}
for (const [path, blocks] of Object.entries(content)) {
    const page = byPath[path]
    if (!page) continue
    const withForm = path === '/get-a-quote' && form ? [{ type: 'form', props: { heading: 'Get a free quote', formId: form.id } }] : []
    await api('PATCH', `/api/sites/${siteId}/pages/${page.id}`, { blocks: [...blocks, ...withForm].map(b => ({ id: id(), ...b })) })
    await api('POST', `/api/sites/${siteId}/pages/${page.id}/publish`, {})
}
console.log('Filled in the pages')

// ── Form replies, as if customers had been in touch (straight into the dev database) ──
if (form) {
    await sql`delete from form_replies where site_id = ${siteId}`
    const [f] = await sql`select fields from forms where id = ${form.id}`
    const label = (kind, fallback) => f.fields.find(x => x.kind === kind)?.label ?? fallback
    const people = [
        ['Hannah Price', 'hannah@example.com', 'Two dining chairs with torn seats. Could you do them in a dark green?', 0, true, false],
        ['Mark Ellis', 'mark@example.com', 'Quote for a three-seater sofa, currently cream linen, want something more hard-wearing.', 3, true, true],
        ['Jo Whitfield', 'jo@example.com', 'Wingback chair, springs have gone. Happy to drop it off.', 26, false, false],
        ['Amir Khan', 'amir@example.com', 'Do you do headboards? Looking for a king size in velvet.', 50, false, false]
    ]
    for (const [name, mail, msg, hoursAgo, read, done] of people) {
        const data = { [label('text', 'Name')]: name, [label('email', 'Email')]: mail, [label('textarea', 'Message')]: msg }
        const at = new Date(Date.now() - hoursAgo * 3600_000)
        await sql`insert into form_replies (site_id, form_id, data, page_path, created_at, read_at, done_at)
            values (${siteId}, ${form.id}, ${JSON.stringify(data)}, '/get-a-quote', ${at}, ${read ? at : null}, ${done ? at : null})`
    }
    console.log('Added 4 form replies')
}
console.log(`Demo site ready: ${BASE}/sites/${siteId}`)

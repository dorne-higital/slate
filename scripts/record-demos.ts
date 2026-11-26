// Records the demo videos for slatecms.co.uk from the real CMS, driving the local demo site
// (scripts/demo-site.mjs) in Chrome, then encodes small looping MP4s and posters into public/videos.
//
//   yarn dev:test (on :3002) and node --env-file=.env scripts/demo-site.mjs first, then:
//   yarn demos:record                  every video
//   yarn demos:record editor seo       just these
//   yarn demos:record --inspect /sites/<id>/seo     list what's clickable on a page (for writing scenes)
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { neon } from '@neondatabase/serverless'
import ffmpeg from 'ffmpeg-static'
import { chromium, type Locator, type Page } from 'playwright-core'
import { DOMAIN_PRICES } from '../shared/utils/domainPrices'

const BASE = process.env.DEMO_BASE_URL ?? 'http://localhost:3002'
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = resolve('public/videos')
const RAW = resolve('.demo/raw')
const W = 1440
const H = 900
if (!process.env.DEMO_EMAIL || !process.env.DEMO_PASSWORD) throw new Error('Run scripts/demo-site.mjs first (it sets DEMO_EMAIL and DEMO_PASSWORD in .env)')
const sql = neon(process.env.NUXT_DATABASE_URL!)
const [{ id: SITE, slug: SLUG }] = await sql`select s.id, s.slug from sites s join site_members m on m.site_id = s.id join "user" u on u.id = m.user_id where u.email = ${process.env.DEMO_EMAIL} and s.deleted_at is null order by s.created_at limit 1` as { id: string, slug: string }[]
const LIVE = BASE.replace('://', `://${SLUG}.`)

// A visible cursor and caption bar, drawn into every page (recorded videos don't show the real cursor)
const OVERLAY = `
(() => {
    const add = () => {
        if (document.getElementById('__demo-cursor')) return
        const c = document.createElement('div')
        c.id = '__demo-cursor'
        c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-4px 0 0 -4px;z-index:2147483647;pointer-events:none;transition:transform .08s linear'
        c.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l15 9-7 1.5-3.5 6.5z" fill="#2e3445" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
        document.body.appendChild(c)
        const cap = document.createElement('div')
        cap.id = '__demo-caption'
        cap.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translate(-50%,12px);opacity:0;z-index:2147483646;pointer-events:none;background:#2e3445;color:#fff;font:600 21px/1.3 "Schibsted Grotesk",system-ui,sans-serif;padding:14px 24px;border-radius:999px;box-shadow:0 12px 30px #0004,inset 0 -3px 0 #e8a33a;transition:opacity .35s,transform .35s;white-space:nowrap'
        document.body.appendChild(cap)
        const last = sessionStorage.getItem('__demo-xy')
        if (last) c.style.transform = 'translate(' + last + ')'
        const lastCap = sessionStorage.getItem('__demo-cap')
        if (lastCap) { cap.textContent = lastCap; cap.style.opacity = '1'; cap.style.transform = 'translate(-50%,0)' }
    }
    document.addEventListener('mousemove', e => {
        const c = document.getElementById('__demo-cursor')
        if (c) c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'
        sessionStorage.setItem('__demo-xy', e.clientX + 'px,' + e.clientY + 'px')
    }, true)
    document.addEventListener('mousedown', () => {
        const c = document.getElementById('__demo-cursor')
        if (!c) return
        c.animate([{ scale: 1 }, { scale: .8 }, { scale: 1 }], { duration: 220 })
    }, true)
    window.__caption = (t) => {
        add()
        const cap = document.getElementById('__demo-caption')
        sessionStorage.setItem('__demo-cap', t || '')
        if (!t) { cap.style.opacity = '0'; cap.style.transform = 'translate(-50%,12px)'; return }
        cap.textContent = t; cap.style.opacity = '1'; cap.style.transform = 'translate(-50%,0)'
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add)
    else add()
    // Nuxt replaces the page on navigation: put the overlay back
    new MutationObserver(add).observe(document.documentElement, { childList: true, subtree: true })
})()`

/** The helpers every scene uses: move the cursor smoothly, click, type like a person, caption. */
function director(page: Page) {
    let x = W / 2
    let y = H / 2
    const wait = (ms: number) => page.waitForTimeout(ms)
    async function moveTo(target: Locator) {
        await target.scrollIntoViewIfNeeded()
        const box = (await target.boundingBox())!
        const tx = box.x + Math.min(box.width / 2, 60)
        const ty = box.y + box.height / 2
        const steps = Math.max(12, Math.round(Math.hypot(tx - x, ty - y) / 22))
        for (let i = 1; i <= steps; i++) {
            const t = i / steps
            const e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
            await page.mouse.move(x + (tx - x) * e, y + (ty - y) * e)
            await wait(12)
        }
        x = tx
        y = ty
    }
    return {
        page,
        wait,
        moveTo,
        async click(target: Locator, pause = 500) {
            await moveTo(target)
            await wait(250)
            await target.click()
            await wait(pause)
        },
        async type(target: Locator, text: string, { clear = true } = {}) {
            await moveTo(target)
            await target.click()
            if (clear) {
                await page.keyboard.press('Meta+A')
                await page.keyboard.press('Backspace')
            }
            await page.keyboard.type(text, { delay: 45 })
            await wait(400)
        },
        async caption(text: string) {
            await page.evaluate(t => (window as unknown as { __caption: (t: string) => void }).__caption(t), text)
            await wait(300)
        },
        async go(path: string) {
            await page.goto(path.startsWith('http') ? path : `${BASE}${path}`)
            // Some pages keep a request open (polling), so "network idle" can't be relied on
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
            await wait(600)
        },
        async scroll(by: number) {
            for (let i = 0; i < 12; i++) {
                await page.mouse.wheel(0, by / 12)
                await wait(30)
            }
            await wait(400)
        }
    }
}
type Director = ReturnType<typeof director>

/** Each scene: what it shows, in order. Captions say what's happening in plain words. */
const SCENES: Record<string, (d: Director) => Promise<void>> = {
    async editor(d) {
        const { page } = d
        const home = (await sql`select id from pages where site_id = ${SITE} and path = '/'`)[0]!.id
        await d.go(`/sites/${SITE}/pages/${home}`)
        await d.caption('Every page is a stack of blocks')
        await d.wait(1200)
        await d.caption('Click a block to change it')
        await d.click(page.getByRole('button', { name: 'Select Hero block' }))
        await d.type(page.getByLabel('Heading', { exact: true }), 'Reupholstered by hand in Chester')
        await d.wait(800)
        await d.caption('Add blocks from the library')
        await d.click(page.locator('summary', { hasText: 'Show what you do' }), 600)
        await d.click(page.getByRole('button', { name: 'Steps', exact: true }), 1400)
        await d.caption('Check it on a phone')
        await d.click(page.getByRole('button', { name: 'Phone', exact: true }), 1800)
        await d.click(page.getByRole('button', { name: 'Desktop', exact: true }), 800)
        await d.caption('Every publish is kept, so you can go back')
        await d.click(page.getByRole('button', { name: 'History', exact: true }), 1800)
        await d.click(page.getByRole('button', { name: 'Close' }), 600)
        await d.caption('Publish when you’re ready')
        await d.click(page.getByRole('button', { name: /^Publish/ }), 1600)
    },

    async tour(d) {
        const { page } = d
        await d.go(`/sites/${SITE}`)
        await d.caption('Your site, ready to make your own')
        await d.wait(1600)
        await d.click(page.getByRole('link', { name: 'Edit home page' }), 1200)
        await d.caption('Click any block and type')
        await d.click(page.getByRole('button', { name: 'Select Hero block' }))
        await d.type(page.getByLabel('Heading', { exact: true }), 'Reupholstered by hand in Chester')
        await d.caption('Publish when you’re happy')
        await d.click(page.getByRole('button', { name: /^Publish/ }), 1400)
        await d.caption('Set your colours and fonts once')
        await d.go(`/sites/${SITE}/theme`)
        await d.click(page.getByRole('button', { name: 'Harbour blue', exact: true }), 1200)
        await d.click(page.getByRole('button', { name: 'Terracotta', exact: true }), 1400)
        await d.click(page.getByRole('button', { name: 'Save theme' }), 1000)
        await d.caption('And it’s live')
        await d.go(LIVE)
        await d.wait(1200)
        await d.scroll(700)
        await d.scroll(700)
        await d.wait(800)
    },

    async seo(d) {
        const { page } = d
        await d.go(`/sites/${SITE}`)
        await d.caption('Site health shows exactly what to fix')
        await d.click(page.getByRole('button', { name: /Site health/ }), 1200)
        await d.scroll(380)
        await d.wait(1500)
        await d.caption('Write how each page looks on Google')
        await d.go(`/sites/${SITE}/seo`)
        await d.click(page.getByRole('button', { name: 'Services', exact: true }), 600)
        await d.type(page.locator('#sdesc'), 'Full reupholstery, re-covering and repairs for chairs and sofas in Chester. Free quotes within two days.')
        await d.wait(1200)
        await d.click(page.getByRole('button', { name: 'Save changes' }), 1000)
        await d.caption('Moving from another site? Keep your place on Google')
        const from = page.getByPlaceholder(/old-page/)
        await from.scrollIntoViewIfNeeded()
        await d.wait(500)
        await d.type(from, '/upholstery-services')
        await d.type(page.getByPlaceholder(/new-page/), '/services')
        await d.click(page.getByRole('button', { name: 'Add', exact: true }), 1600)
    },

    async forms(d) {
        const { page } = d
        await d.go(`/sites/${SITE}/forms`)
        await d.caption('Every reply in one inbox, and by email')
        await d.wait(1200)
        await d.click(page.getByRole('button', { name: /^Hannah Price/ }), 1600)
        await d.caption('Mark it done when it’s dealt with')
        await d.click(page.getByRole('button', { name: /done/i }).filter({ hasNotText: /^Done$/ }).first(), 1200)
        await d.click(page.getByRole('button', { name: 'Done', exact: true }), 1400)
        await d.click(page.getByRole('button', { name: 'To do', exact: true }), 1000)
        await d.caption('Reply straight from the message')
        await d.click(page.getByRole('button', { name: /Jo Whitfield/ }), 2200)
        await d.caption('Send replies to Slack, Mailchimp and more')
        await d.go(`/sites/${SITE}/integrations`)
        await d.click(page.getByRole('tab', { name: /^Forms and email/ }), 1800)
    },

    async integrations(d) {
        const { page } = d
        await d.go(`/sites/${SITE}/integrations`)
        await d.caption('Connect the tools you use by pasting a code')
        await d.wait(800)
        await d.click(page.getByRole('tab', { name: /^Analytics/ }), 900)
        await d.click(page.getByRole('tab', { name: /^Contact/ }), 900)
        await d.caption('Add a WhatsApp button in seconds')
        await d.click(page.getByRole('button', { name: /WhatsApp/ }).first(), 900)
        await d.type(page.getByRole('dialog').getByRole('textbox').first(), '07700 900123')
        await d.click(page.getByRole('dialog').getByRole('button', { name: /^(Save|Connect)/ }).first(), 1200)
        await d.caption('It’s on every page of your site')
        await d.go(LIVE)
        await d.wait(1200)
        await d.scroll(600)
        await d.moveTo(page.getByRole('link', { name: /on WhatsApp/ }).first())
        await d.wait(1500)
        await d.go(`${LIVE}/services`)
        await d.wait(1800)
    },

    async domains(d) {
        const { page } = d
        // The registrar can't be reached from a local machine, so answer the search with Slate's real prices
        // (the business is made up, so "available" is illustrative)
        await page.route('**/domains/search', route => route.fulfill({
            json: { simulated: false, options: Object.entries(DOMAIN_PRICES).map(([tld, price], i) => ({ domain: `brambleandoak.${tld}`, tld, available: i !== 3, price: i !== 3 ? price : null, reason: i === 3 ? 'Already taken' : undefined })) }
        }))
        await d.go(`/sites/${SITE}/domains`)
        await d.caption('Find and buy a domain without leaving Slate')
        await d.type(page.getByLabel('Domain you’d like'), 'brambleandoak')
        await d.click(page.getByRole('button', { name: 'Search', exact: true }), 3500)
        await d.caption('Or connect one you already own')
        await d.click(page.getByRole('button', { name: 'Connect a domain' }), 1800)
        await d.caption('Free email forwarding for domains bought here')
        await d.go(`/sites/${SITE}/integrations`)
        await d.click(page.getByRole('button', { name: /Email forwarding/ }).first(), 2200)
    }
}

async function newContext(record = false) {
    const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] })
    const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'no-preference' })
    await context.addInitScript(OVERLAY)
    const login = await context.request.post(`${BASE}/api/auth/sign-in/email`, {
        data: { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD },
        headers: { 'origin': BASE, 'x-turnstile-token': 'XXXX.DUMMY.TOKEN.XXXX' }
    })
    if (!login.ok()) throw new Error(`Demo login failed (${login.status()}). Is yarn dev:test running on ${BASE}?`)
    return { browser, context, record }
}

/**
 * Records a page with Chrome's own screencast: a JPEG whenever the screen changes, with its time.
 * Returns stop(), which writes the frames plus an ffmpeg list that holds each frame for as long as it showed.
 */
async function screencast(page: Page, dir: string) {
    const cdp = await page.context().newCDPSession(page)
    const frames: { file: string, t: number }[] = []
    cdp.on('Page.screencastFrame', async (f: { data: string, sessionId: number, metadata: { timestamp: number } }) => {
        const file = join(dir, `f${String(frames.length).padStart(6, '0')}.jpg`)
        writeFileSync(file, Buffer.from(f.data, 'base64'))
        frames.push({ file, t: f.metadata.timestamp })
        await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
    })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 })
    return async () => {
        await cdp.send('Page.stopScreencast').catch(() => {})
        const end = Date.now() / 1000
        const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? end) - f.t)).toFixed(3)}`).join('\n')
        const listFile = join(dir, 'frames.txt')
        writeFileSync(listFile, `${list}\nfile '${frames.at(-1)!.file}'\n`)
        return listFile
    }
}

function encode(list: string | null, name: string) {
    const mp4 = join(OUT, `${name}.mp4`)
    const webp = join(OUT, `${name}.webp`)
    if (list) execFileSync(ffmpeg!, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', 'scale=1280:-2,fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4])
    // ffmpeg reports the length on stderr
    const probe = spawnSync(ffmpeg!, ['-i', mp4], { encoding: 'utf8' }).stderr
    const [, h, m, sec] = probe.match(/Duration: (\d+):(\d+):([\d.]+)/) ?? []
    const seconds = Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(sec ?? 0)
    // The poster is the frame 40% of the way in: past the opening page load, in the thick of it
    execFileSync(ffmpeg!, ['-y', '-loglevel', 'error', '-ss', (seconds * 0.4).toFixed(1), '-i', mp4, '-frames:v', '1', '-vf', 'scale=1280:-2', '-c:v', 'libwebp', '-quality', '80', webp])
    console.log(`${name}: ${(statSync(mp4).size / 1048576).toFixed(1)} MB, ${seconds.toFixed(0)} s`)
}

async function inspect(path: string, clicks: string[]) {
    const { browser, context } = await newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}${path}`)
    await page.waitForLoadState('networkidle')
    for (const name of clicks) {
        await page.getByRole('button', { name, exact: true }).first().click()
        await page.waitForTimeout(800)
    }
    const items = await page.evaluate(() => [...document.querySelectorAll('button, a, input, textarea, select, [role="tab"], summary, h1, h2, h3')]
        .filter(e => (e as HTMLElement).offsetParent !== null)
        .map((e) => {
            const el = e as HTMLInputElement
            const label = el.labels?.[0]?.textContent?.trim()
            return `${e.tagName.toLowerCase()}${el.type ? `[${el.type}]` : ''}: ${(label || el.getAttribute('aria-label') || el.placeholder || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70)}`
        }))
    console.log(items.join('\n'))
    await browser.close()
}

// --posters: just remake the posters from the videos already in public/videos
if (process.argv[2] === '--posters') {
    for (const name of Object.keys(SCENES)) encode(null, name)
    process.exit(0)
}

if (process.argv[2] === '--inspect') {
    // --inspect <path> [--click "Button name"]...
    const clicks = process.argv.flatMap((a, i) => a === '--click' ? [process.argv[i + 1]!] : [])
    await inspect(process.argv[3]!.replace('<site>', SITE), clicks)
    process.exit(0)
}

const wanted = process.argv.slice(2).filter(a => !a.startsWith('-'))
const names = wanted.length ? wanted : Object.keys(SCENES)
mkdirSync(OUT, { recursive: true })
for (const name of names) {
    const scene = SCENES[name]
    if (!scene) throw new Error(`No scene called ${name}. Scenes: ${Object.keys(SCENES).join(', ')}`)
    execFileSync('node', ['--env-file=.env', 'scripts/demo-site.mjs'], { stdio: 'ignore' })
    rmSync(RAW, { recursive: true, force: true })
    mkdirSync(RAW, { recursive: true })
    const { browser, context } = await newContext(true)
    const page = await context.newPage()
    const d = director(page)
    let list = ''
    try {
        await page.goto(`${BASE}/sites/${SITE}`)
        const stop = await screencast(page, RAW)
        try {
            await scene(d)
        } catch (err) {
            await page.screenshot({ path: resolve(`.demo/failed-${name}.png`) })
            console.error(`${name} failed: screenshot in .demo/failed-${name}.png`)
            throw err
        }
        await d.wait(1200)
        list = await stop()
    } finally {
        await context.close()
        await browser.close()
    }
    encode(list, name)
}
export { LIVE, SITE }

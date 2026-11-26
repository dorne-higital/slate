// Makes the 1200×630 share images for every page of slatecms.co.uk (public/og/), plus screenshots of
// real sites made with Slate for the "Made with Slate" cards. Uses the Chrome you already have.
//
//   yarn og:images            every image
//   yarn og:images home       just /og/home.png (names without .png)
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { MARKETING_PAGES, type MarketingSection } from '../shared/utils/marketing'

const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = resolve('public/og')
const only = process.argv.slice(2)
mkdirSync(OUT, { recursive: true })
const work = mkdtempSync(join(tmpdir(), 'slate-og-'))

const SECTION: Record<MarketingSection, string> = {
    home: 'Website builder for UK small businesses',
    features: 'Features',
    for: 'Who it’s for',
    pricing: 'Pricing',
    compare: 'Compare',
    guides: 'Guides',
    company: 'Slate',
    legal: 'Slate'
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function card(eyebrow: string, title: string, path: string) {
    // Longer headlines get a smaller size so they always fit in three lines
    const size = title.length > 46 ? 64 : title.length > 30 ? 74 : 86
    return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@500;700;900&display=block" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; }
html, body { height: 630px; width: 1200px; }
body { background: #f7f8fa; color: #2e3445; display: flex; flex-direction: column; font-family: 'Schibsted Grotesk', sans-serif; justify-content: space-between; overflow: hidden; padding: 72px 80px 0; position: relative; }
.brand { align-items: center; display: flex; font-size: 40px; font-weight: 900; gap: 16px; letter-spacing: -.04em; }
.eyebrow { color: #5b5773; font-size: 24px; font-weight: 700; letter-spacing: .06em; margin-bottom: 22px; text-transform: uppercase; }
h1 { font-size: ${size}px; font-weight: 900; letter-spacing: -.045em; line-height: 1.02; max-width: 960px; }
.foot { align-items: center; display: flex; font-size: 26px; font-weight: 500; justify-content: space-between; padding-bottom: 44px; }
.addr { color: #555c6e; }
.pill { background: #e8a33a; border-radius: 999px; color: #2e3445; font-weight: 700; padding: 12px 26px; }
.strata { background: linear-gradient(#5b5773 0 8px, #8c93a3 8px 16px, #c3c8d1 16px 24px); bottom: 0; height: 24px; left: 0; position: absolute; right: 0; }
.sheets { position: absolute; right: -60px; top: 70px; }
.sheets i { background: #fff; border-radius: 6px; box-shadow: 1px 1px 0 #d4d8df, 2px 2px 0 #c3c8d1, 3px 3px 0 #b2b8c3, 4px 4px 0 #8c93a3; display: block; height: 120px; position: absolute; width: 260px; }
</style></head><body>
<div class="sheets" aria-hidden="true"><i style="right:0;top:0;opacity:.5"></i><i style="right:30px;top:40px;opacity:.7"></i><i style="right:60px;top:80px"></i></div>
<div class="brand"><svg width="46" height="40" viewBox="0 0 30 26"><path d="M6 18h22l-4 6H2z" fill="#8C93A3"/><path d="M6 10h22l-4 6H2z" fill="#5B5773"/><path d="M6 2h22l-4 6H2z" fill="#2E3445"/></svg>slate</div>
<div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1></div>
<div class="foot"><span class="addr">slatecms.co.uk${path === '/' ? '' : esc(path)}</span><span class="pill">14 days free</span></div>
<div class="strata"></div>
</body></html>`
}

function shoot(target: string, file: string, width: number, height: number) {
    execFileSync(CHROME, [
        '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
        `--window-size=${width},${height}`, '--virtual-time-budget=6000', `--screenshot=${file}`, target
    ], { stdio: 'ignore' })
}

const wanted = (name: string) => !only.length || only.includes(name)
let made = 0
for (const p of MARKETING_PAGES) {
    const name = p.image.replace(/^\/og\//, '').replace(/\.png$/, '')
    if (!wanted(name)) continue
    const html = join(work, `${name}.html`)
    writeFileSync(html, card(SECTION[p.section], p.h1, p.path))
    shoot(`file://${html}`, join(OUT, `${name}.png`), 1200, 630)
    made++
}

// Real sites made with Slate: the top of each home page, at share-image size
for (const [name, url] of [['example-danhorne', 'https://www.danhorne.co.uk/'], ['example-dobiedash', 'https://www.dobiedash.co.uk/']] as const) {
    if (!wanted(name)) continue
    shoot(url, join(OUT, `${name}.png`), 1200, 630)
    made++
}
console.log(`Made ${made} image${made === 1 ? '' : 's'} in public/og`)

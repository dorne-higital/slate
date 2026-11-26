// Creates (or finds) the Slate site whose blog becomes slatecms.co.uk/guides and whose
// "Contact" form takes messages from slatecms.co.uk/contact. Safe to re-run.
//
//   node --env-file=.env scripts/marketing-site.mjs           (dev database)
//   node --env-file=.env scripts/marketing-site.mjs --prod    (live database)
//
// The site is owned by the platform admin, kept offline (so its own address shows nothing)
// and comped. Prints the site ID to put in NUXT_MARKETING_SITE_ID.
import { neon } from '@neondatabase/serverless'

const prod = process.argv.includes('--prod')
const url = prod ? process.env.PROD_DATABASE_URL_UNPOOLED : process.env.NUXT_DATABASE_URL
if (!url) throw new Error(prod ? 'PROD_DATABASE_URL_UNPOOLED is not set' : 'NUXT_DATABASE_URL is not set')
const sql = neon(url)

const SLUG = 'slate-guides'
const CATEGORIES = [['Getting found', 'getting-found'], ['Running your site', 'running-your-site'], ['Rules and paperwork', 'rules-and-paperwork']]
const id = () => crypto.randomUUID()

const [admin] = await sql`select id from "user" where is_platform_admin order by created_at limit 1`
if (!admin) throw new Error('No platform admin found')

let [site] = await sql`select id from sites where slug = ${SLUG}`
if (!site) {
    const siteId = id()
    const formId = id()
    const fields = [
        { id: id(), label: 'Name', kind: 'text', required: true },
        { id: id(), label: 'Email', kind: 'email', required: true },
        { id: id(), label: 'Message', kind: 'textarea', required: true }
    ]
    const home = [{ id: id(), type: 'hero', props: { heading: 'Slate guides', text: 'The guides live at slatecms.co.uk/guides.', buttonLabel: '', buttonUrl: '' } }]
    await sql.transaction([
        sql`insert into sites (id, name, slug, billing_user_id, offline) values (${siteId}, 'Slate guides', ${SLUG}, ${admin.id}, true)`,
        sql`insert into site_members (site_id, user_id, role) values (${siteId}, ${admin.id}, 'owner')`,
        sql`insert into forms (id, site_id, name, fields, success_message) values (${formId}, ${siteId}, 'Contact', ${JSON.stringify(fields)}, 'Thanks, we’ve got your message and will reply within a working day.')`,
        sql`insert into pages (site_id, title, path, position, status, blocks, published_blocks, published_at, updated_by) values (${siteId}, 'Home', '/', 0, 'published', ${JSON.stringify(home)}, ${JSON.stringify(home)}, now(), ${admin.id})`
    ])
    site = { id: siteId }
    console.log('Created the Slate guides site')
}
for (const [name, slug] of CATEGORIES) {
    await sql`insert into post_categories (site_id, name, slug) values (${site.id}, ${name}, ${slug}) on conflict do nothing`
}
console.log(`NUXT_MARKETING_SITE_ID=${site.id}`)

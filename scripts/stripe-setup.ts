/**
 * Makes Stripe match shared/utils/plans.ts. Safe to run again any time:
 *   yarn stripe:setup               — products, prices and the customer portal
 *   yarn stripe:setup --webhook URL — also creates the webhook endpoint (secret goes to stdout as JSON only)
 *
 * Prices in Stripe can't be edited, so a changed price is created new and takes over the lookup key;
 * the old one is archived. People already paying stay on their old price until moved in Stripe.
 * Output is one JSON line: { portalConfig, webhookSecret? }. Progress goes to stderr.
 */
import { PLANS, priceLookupKey } from '../shared/utils/plans.ts'

const KEY = process.env.STRIPE_SECRET_KEY ?? process.env.NUXT_STRIPE_SECRET_KEY
if (!KEY) throw new Error('STRIPE_SECRET_KEY is not set')
const log = (...a: unknown[]) => console.error(...a)

function encode(params: Record<string, unknown>, prefix = '', out = new URLSearchParams()) {
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue
        const key = prefix ? `${prefix}[${k}]` : k
        if (Array.isArray(v)) v.forEach((item, i) => typeof item === 'object' ? encode(item as Record<string, unknown>, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item)))
        else if (typeof v === 'object') encode(v as Record<string, unknown>, key, out)
        else out.append(key, String(v))
    }
    return out
}
async function api(method: string, path: string, params: Record<string, unknown> = {}, allow404 = false): Promise<any> {
    const body = encode(params)
    const res = await fetch(`https://api.stripe.com/v1/${path}${method === 'GET' && body.size ? `?${body}` : ''}`, {
        method,
        headers: { 'authorization': `Bearer ${KEY}`, 'content-type': 'application/x-www-form-urlencoded', 'stripe-version': '2024-06-20' },
        body: method === 'GET' ? undefined : body
    })
    const data = await res.json() as any
    if (res.status === 404 && allow404) return null
    if (!res.ok) throw new Error(`${method} ${path}: ${data.error?.message}`)
    return data
}

const mode = KEY.startsWith('sk_live_') ? 'LIVE' : 'test'
log(`Stripe ${mode} mode`)
const portalProducts: { product: string, prices: string[] }[] = []

for (const plan of PLANS) {
    const productId = `slate_${plan.key}`
    let product = await api('GET', `products/${productId}`, {}, true)
    if (!product) {
        product = await api('POST', 'products', { id: productId, name: `Slate ${plan.name}`, description: plan.tagline })
        log(`  made product ${productId}`)
    } else if (product.name !== `Slate ${plan.name}` || product.description !== plan.tagline || !product.active) {
        await api('POST', `products/${productId}`, { name: `Slate ${plan.name}`, description: plan.tagline, active: true })
        log(`  updated product ${productId}`)
    }

    const priceIds: string[] = []
    for (const [interval, amount] of [['month', plan.monthly], ['year', plan.yearly]] as const) {
        const lookup = priceLookupKey(plan.key, interval)
        const existing = (await api('GET', 'prices', { lookup_keys: [lookup], active: true })).data[0]
        if (existing && existing.unit_amount === amount && existing.currency === 'gbp' && existing.recurring?.interval === interval && existing.product === productId) {
            priceIds.push(existing.id)
            continue
        }
        const price = await api('POST', 'prices', {
            product: productId, currency: 'gbp', unit_amount: amount, recurring: { interval },
            lookup_key: lookup, transfer_lookup_key: true, nickname: `${plan.name} ${interval === 'month' ? 'monthly' : 'yearly'}`
        })
        if (existing) await api('POST', `prices/${existing.id}`, { active: false })
        log(`  ${existing ? 'changed' : 'made'} price ${lookup}: £${amount / 100}`)
        priceIds.push(price.id)
    }
    portalProducts.push({ product: productId, prices: priceIds })
}

// Customer portal: change plan, card, details, cancel at period end, invoices
const portal = {
    business_profile: { headline: 'Manage your Slate plan' },
    features: {
        customer_update: { enabled: true, allowed_updates: ['name', 'email', 'address', 'tax_id'] },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: 'at_period_end' },
        subscription_update: { enabled: true, default_allowed_updates: ['price'], proration_behavior: 'create_prorations', products: portalProducts }
    },
    metadata: { slate: '1' }
}
const configs = (await api('GET', 'billing_portal/configurations', { limit: 100 })).data as any[]
let config = configs.find(c => c.metadata?.slate === '1' && c.active)
config = config ? await api('POST', `billing_portal/configurations/${config.id}`, portal) : await api('POST', 'billing_portal/configurations', portal)
log(`  portal configuration ready`)

const out: { portalConfig: string, webhookSecret?: string } = { portalConfig: config.id }
const i = process.argv.indexOf('--webhook')
if (i > 0) {
    const url = process.argv[i + 1]
    const events = ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted']
    const endpoints = (await api('GET', 'webhook_endpoints', { limit: 100 })).data as any[]
    const found = endpoints.find(e => e.url === url)
    if (found) {
        await api('POST', `webhook_endpoints/${found.id}`, { enabled_events: events, disabled: false })
        log(`  webhook already exists for ${url} (secret unchanged)`)
    } else {
        const created = await api('POST', 'webhook_endpoints', { url, enabled_events: events, api_version: '2024-06-20', description: 'Slate subscriptions' })
        out.webhookSecret = created.secret
        log(`  made webhook for ${url}`)
    }
}
console.log(JSON.stringify(out))

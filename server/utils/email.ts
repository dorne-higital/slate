/**
 * Sends email through Resend. Without NUXT_RESEND_API_KEY (local dev) emails are logged instead.
 * Every email has a plain-text version; the HTML is a single simple card in Slate's colours.
 */

interface Email {
    to: string | string[]
    subject: string
    /** Short paragraphs; blank line between paragraphs */
    text: string
    button?: { label: string, url: string }
    /** Shown as a label/value table under the text (form replies) */
    rows?: [string, string][]
    replyTo?: string
    /** Display name before the address, e.g. "Bramble & Oak via Slate" */
    fromName?: string
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[c]!)

function render(e: Email) {
    const paras = e.text.split(/\n{2,}/).map(p => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#2E3445">${esc(p).replace(/\n/g, '<br>')}</p>`).join('')
    const rows = e.rows?.length
        ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 20px">${e.rows.map(([k, v]) => `<tr><td style="padding:10px 12px 10px 0;border-top:1px solid #E4E7EC;color:#555C6E;font-size:14px;vertical-align:top;width:34%">${esc(k)}</td><td style="padding:10px 0;border-top:1px solid #E4E7EC;color:#2E3445;font-size:15px;white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>`
        : ''
    const button = e.button
        ? `<p style="margin:8px 0 20px"><a href="${esc(e.button.url)}" style="display:inline-block;background:#2E3445;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:6px">${esc(e.button.label)}</a></p>`
        : ''
    const html = `<!doctype html><html><body style="margin:0;background:#F4F5F7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" style="width:100%;padding:24px 12px"><tr><td align="center">
<table role="presentation" style="width:100%;max-width:560px;background:#fff;border-radius:10px;padding:28px">
<tr><td><p style="margin:0 0 20px;font-weight:900;font-size:18px;letter-spacing:-.02em;color:#2E3445">Slate</p>${paras}${rows}${button}
<p style="margin:12px 0 0;font-size:13px;color:#7A8091">Sent by Slate · slatecms.co.uk</p></td></tr></table></td></tr></table></body></html>`
    const text = [e.text, e.rows?.map(([k, v]) => `${k}: ${v}`).join('\n'), e.button ? `${e.button.label}: ${e.button.url}` : ''].filter(Boolean).join('\n\n')
    return { html, text }
}

export async function sendEmail(e: Email): Promise<boolean> {
    const { resendApiKey, emailFrom } = useRuntimeConfig()
    const { html, text } = render(e)
    const from = `${(e.fromName ?? 'Slate').replace(/[<>"]/g, '')} <${emailFrom || 'hello@slatecms.co.uk'}>`
    if (!resendApiKey) {
        console.log('[email:not-sent]', JSON.stringify({ from, to: e.to, subject: e.subject, replyTo: e.replyTo, text }))
        return false
    }
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'authorization': `Bearer ${resendApiKey}`, 'content-type': 'application/json' },
            body: JSON.stringify({ from, to: e.to, subject: e.subject, html, text, reply_to: e.replyTo })
        })
        if (!res.ok) console.error('[email] failed', res.status, (await res.text()).slice(0, 300))
        return res.ok
    } catch (err) {
        // Email is never allowed to break the action that triggered it
        console.error('[email] failed', (err as Error).message)
        return false
    }
}

/** Runs an email in the background on Workers (after the response), or awaits it elsewhere. */
export function sendInBackground(event: { waitUntil?: (p: Promise<unknown>) => void } | undefined, e: Email) {
    const p = sendEmail(e)
    if (event?.waitUntil) event.waitUntil(p)
    return p
}

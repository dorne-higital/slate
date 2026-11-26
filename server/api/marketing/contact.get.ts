/** The questions on slatecms.co.uk/contact, from the guides site's Contact form. */
export default defineEventHandler(async () => {
    const site = await marketingSite()
    const form = site ? await marketingContactForm(site.id) : null
    if (!form) return { available: false, fields: [], submitLabel: 'Send' }
    return {
        available: true,
        fields: form.fields.filter(f => f.kind !== 'step').map(f => ({ id: f.id, label: f.label, kind: f.kind, required: !!f.required, options: f.options ?? [] })),
        submitLabel: form.submitLabel
    }
})

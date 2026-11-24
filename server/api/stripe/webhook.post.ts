/** Stripe tells us about subscription changes here. Signed with the endpoint's secret. */
export default defineEventHandler(async (event) => {
    const payload = await readRawBody(event, 'utf8') ?? ''
    const ok = await verifyStripeSignature(payload, getRequestHeader(event, 'stripe-signature'), useRuntimeConfig().stripeWebhookSecret)
    if (!ok) throw createError({ statusCode: 400, statusMessage: 'Bad signature' })

    const evt = JSON.parse(payload) as { type: string, data: { object: Record<string, any> } }
    const obj = evt.data.object
    if (evt.type.startsWith('customer.subscription.')) {
        // Re-read so out-of-order events can't leave stale state
        await syncSubscription(await stripe('GET', `subscriptions/${obj.id}`))
    } else if (evt.type === 'checkout.session.completed' && obj.subscription) {
        await syncSubscription(await stripe('GET', `subscriptions/${obj.subscription}`))
    }
    return { received: true }
})

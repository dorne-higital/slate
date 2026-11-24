/** What an invitation link is for, so the invite page can say "Join X as an editor". */
export default defineEventHandler(async (event) => {
    const found = await findOpenInvite(getRouterParam(event, 'token')!)
    if (!found) throw createError({ statusCode: 410, statusMessage: 'This invitation has expired or has already been used.' })
    return { siteName: found.site.name, role: found.invite.role }
})

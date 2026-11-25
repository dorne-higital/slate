export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    return await acceptInvite(getRouterParam(event, 'token')!, user.id)
})

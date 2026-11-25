/** What would happen if this account were deleted (shown before they confirm). */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    return { ...(await planAccountDeletion(user.id)), isPlatformAdmin: !!user.isPlatformAdmin }
})

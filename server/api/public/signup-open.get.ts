/** Whether the sign-up form should show: always after launch, or with a valid private link. */
export default defineEventHandler(async (event) => {
    return { open: await signupOpen(getQuery(event).key) }
})

export default defineTask({
    meta: { name: 'billing:trial-reminders', description: 'Email people whose trial ends within 3 days' },
    async run() {
        const sent = await sendTrialReminders()
        console.log('[trial-reminders]', sent)
        return { result: { sent } }
    }
})

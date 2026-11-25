import { defineConfig } from 'vitest/config'

// End-to-end API tests against a running dev server (yarn dev:test) and the dev database. See tests/api/helpers.ts.
export default defineConfig({
    test: {
        include: ['tests/api/**/*.test.ts'],
        testTimeout: 60_000,
        hookTimeout: 120_000,
        fileParallelism: false
    }
})

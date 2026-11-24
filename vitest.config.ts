import { defineConfig } from 'vitest/config'

// Unit tests (tests/unit): pure shared code, no server or database. API tests (tests/api) run with yarn test:api.
export default defineConfig({
    test: {
        include: ['tests/unit/**/*.test.ts'],
        setupFiles: ['tests/setup-globals.ts']
    }
})

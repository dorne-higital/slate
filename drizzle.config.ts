import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    dialect: 'postgresql',
    schema: './db/schema.ts',
    out: './db/migrations',
    // Migrations prefer the direct (unpooled) connection Neon provides
    dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.NUXT_DATABASE_URL ?? '' }
})

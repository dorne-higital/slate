import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    dialect: 'postgresql',
    schema: './db/schema.ts',
    out: './db/migrations',
    // Migrations use Neon's direct (unpooled) connection. Locally that's the "dev" branch;
    // `yarn db:migrate:prod` sets MIGRATE_TARGET=prod to apply them to the live database.
    dbCredentials: {
        url: (process.env.MIGRATE_TARGET === 'prod' ? process.env.PROD_DATABASE_URL_UNPOOLED : process.env.DATABASE_URL_UNPOOLED ?? process.env.NUXT_DATABASE_URL) ?? ''
    }
})

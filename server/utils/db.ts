import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../../db/schema'

let cached: ReturnType<typeof create> | undefined

function create(url: string) {
    return drizzle(neon(url), { schema })
}

/** Drizzle client over Neon's HTTP driver (works on Cloudflare Workers, no TCP pool needed). */
export function useDb() {
    if (!cached) {
        const url = useRuntimeConfig().databaseUrl
        if (!url) {
            throw createError({ statusCode: 503, statusMessage: 'Database not configured. Set NUXT_DATABASE_URL in .env' })
        }
        cached = create(url)
    }
    return cached
}

export { schema }

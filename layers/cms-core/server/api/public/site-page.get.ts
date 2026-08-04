import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '../../../types/database.types'

/**
 * Unauthenticated by design — this is what a real site visitor hits.
 * Relies entirely on the public RLS policies from
 * supabase/migrations/0005_public_site_access.sql (published pages of
 * active sites, readable by `anon`), not on any app-layer gate — there is
 * no requireSiteAccess() call here because there is no site to require
 * access to; anyone is allowed to read this.
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const siteSlug = String(query.siteSlug ?? '')
    const path = String(query.path ?? '').split('/').filter(Boolean)

    const client = await serverSupabaseClient<Database>(event)

    const { data: site, error: siteError } = await client
        .from('sites')
        .select('id, name, slug, theme, layout, branding')
        .eq('slug', siteSlug)
        .single()

    if (siteError || !site) {
        throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    }

    const { data: pages, error: pagesError } = await client
        .from('pages')
        .select('id, parent_id, slug, title, seo_title, seo_description, blocks')
        .eq('site_id', site.id)

    if (pagesError) {
        throw createError({ statusCode: 500, statusMessage: pagesError.message })
    }

    const candidates = pages ?? []
    let parentId: string | null = null
    let match = candidates.find(page => page.parent_id === null && (page.slug === '' || page.slug === '/'))

    for (const segment of path) {
        const found = candidates.find(page => page.parent_id === parentId && page.slug === segment)
        if (!found) {
            match = undefined
            break
        }
        match = found
        parentId = found.id
    }

    if (!match) {
        throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }

    // Whichever slots the site's chosen header/footer styles actually
    // render — not every site has all three menus set up, and a style
    // component treats a missing one as "no items" rather than an error.
    const { data: menus, error: menusError } = await client
        .from('menus')
        .select('id, name, slug, slot, items')
        .eq('site_id', site.id)

    if (menusError) {
        throw createError({ statusCode: 500, statusMessage: menusError.message })
    }

    return { site, page: match, menus: menus ?? [] }
})

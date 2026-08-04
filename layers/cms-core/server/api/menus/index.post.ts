import { requireSiteAccess } from '../../utils/requireSiteAccess'
import type { MenuSlot } from '../../../types'
import { MENU_SLOT_LABELS } from '../../../utils/siteLayoutStyles'

interface CreateMenuBody {
    siteId: string
    name: string
    slot: MenuSlot
}

const VALID_SLOTS = new Set(Object.keys(MENU_SLOT_LABELS))

export default defineEventHandler(async (event) => {
    const body = await readBody<CreateMenuBody>(event)

    if (!body?.siteId || !body?.name?.trim() || !body?.slot) {
        throw createError({ statusCode: 400, statusMessage: 'siteId, name and slot are required' })
    }

    if (!VALID_SLOTS.has(body.slot)) {
        throw createError({ statusCode: 400, statusMessage: `Unknown slot "${body.slot}"` })
    }

    const slug = slugifySiteName(body.name)

    if (!slug) {
        throw createError({ statusCode: 400, statusMessage: 'Could not derive a valid key from that name' })
    }

    const { client } = await requireSiteAccess(event, body.siteId, 'editor')

    // A friendlier message than the raw unique-constraint violation this
    // would otherwise 400 with — a style only ever looks up one menu per
    // slot (see supabase/migrations/0009_menus_and_layout.sql), so a
    // second one for the same slot has nowhere to go.
    const { data: existing } = await client
        .from('menus')
        .select('id')
        .eq('site_id', body.siteId)
        .eq('slot', body.slot)
        .maybeSingle()

    if (existing) {
        throw createError({
            statusCode: 400,
            statusMessage: `This site already has a menu assigned to "${MENU_SLOT_LABELS[body.slot]}" — edit that one, or delete it first.`
        })
    }

    const { data, error } = await client
        .from('menus')
        .insert({
            site_id: body.siteId,
            name: body.name.trim(),
            slug,
            slot: body.slot,
            items: []
        })
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    return { menu: data }
})

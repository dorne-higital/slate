import { requireSiteAccess } from '../../utils/requireSiteAccess'
import type { MenuItem } from '../../../types'
import type { Database } from '../../../types/database.types'

interface UpdateMenuBody {
    siteId: string
    name?: string
    items?: MenuItem[]
}

type MenuUpdate = Database['public']['Tables']['menus']['Update']

export default defineEventHandler(async (event) => {
    const menuId = getRouterParam(event, 'menuId')
    const body = await readBody<UpdateMenuBody>(event)

    if (!menuId || !body?.siteId) {
        throw createError({ statusCode: 400, statusMessage: 'menuId and siteId are required' })
    }

    const { client } = await requireSiteAccess(event, body.siteId, 'editor')

    const update: MenuUpdate = {}

    if (body.name !== undefined) update.name = body.name.trim()
    if (body.items !== undefined) update.items = body.items

    const { data, error } = await client
        .from('menus')
        .update(update)
        .eq('id', menuId)
        .eq('site_id', body.siteId)
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    return { menu: data }
})

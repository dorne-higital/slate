// Nuxt auto-imports everything in shared/utils. Outside Nuxt, put them on globalThis so the code under test finds them.
import * as blockTypes from '../shared/utils/blockTypes'
import * as domainPrices from '../shared/utils/domainPrices'
import * as fontCatalogue from '../shared/utils/fontCatalogue'
import * as forms from '../shared/utils/forms'
import * as googleFonts from '../shared/utils/googleFonts'
import * as menus from '../shared/utils/menus'
import * as plans from '../shared/utils/plans'
import * as projects from '../shared/utils/projects'
import * as siteTheme from '../shared/utils/siteTheme'
import * as slugify from '../shared/utils/slugify'
import * as roles from '../shared/utils/roles'

Object.assign(globalThis, blockTypes, domainPrices, fontCatalogue, forms, googleFonts, menus, plans, projects, siteTheme, slugify, roles)

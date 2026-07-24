// Flat config built on top of @nuxt/eslint's generated config, which is
// written to app/.nuxt/eslint.config.mjs by `nuxt prepare` (wired as the
// root `postinstall` script) and knows about every auto-import, layer and
// component across both cms-core and app.
import withNuxt from './app/.nuxt/eslint.config.mjs'
import vuejsAccessibility from 'eslint-plugin-vuejs-accessibility'

export default withNuxt(
    {
        plugins: {
            'vuejs-accessibility': vuejsAccessibility
        },
        rules: {
            ...vuejsAccessibility.configs.recommended.rules,

            // Default requires both nesting AND a for/id match; our forms
            // use the equally valid sibling <label for>/<input id> pattern.
            'vuejs-accessibility/label-has-for': ['error', {
                required: { some: ['nesting', 'id'] }
            }],

            indent: ['error', 4, { SwitchCase: 1 }],
            quotes: ['error', 'single', { avoidEscape: true }],
            semi: ['error', 'never'],
            'comma-dangle': ['error', 'never'],

            'no-eval': 'error',
            'no-implied-eval': 'error',
            'vue/no-v-html': 'warn',

            'vue/html-indent': ['error', 4],
            'vue/script-indent': ['error', 4, { switchCase: 1 }],
            'vue/multi-word-component-names': 'off'
        }
    },
    {
        files: ['**/*.vue'],
        rules: {
            indent: 'off'
        }
    }
)

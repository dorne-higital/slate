// Bundles the help articles (content/help/*.md) into server/utils/helpFiles.generated.ts, which the server
// imports. Runs before every build (nuxt.config.ts hook) and with `yarn help:index`. Don't edit the output.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export function buildHelpIndex(root = process.cwd()) {
    const dir = resolve(root, 'content/help')
    const files = Object.fromEntries(readdirSync(dir).filter(f => f.endsWith('.md')).sort().map(f => [f.replace(/\.md$/, ''), readFileSync(join(dir, f), 'utf8')]))
    const out = `// Generated from content/help by scripts/help-index.mjs. Don't edit: change the .md files.\nexport const HELP_FILES: Record<string, string> = ${JSON.stringify(files, null, 4)}\n`
    writeFileSync(resolve(root, 'server/utils/helpFiles.generated.ts'), out)
    return Object.keys(files).length
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(`Bundled ${buildHelpIndex()} help articles`)

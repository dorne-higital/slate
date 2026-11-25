import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const vueFiles = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? vueFiles(p) : p.endsWith('.vue') ? [p] : []
})

describe('component styles', () => {
    // In Vue scoped styles, ":global(.a) .b" compiles to just ".a", silently styling the wrong thing
    // (it once painted every dark section white). Write ".a .b" instead: scoped styles already reach parents.
    it('never follow :global(…) with more selector', () => {
        const bad = vueFiles('app').filter(f => /:global\([^)]*\)\s*[.#[\w>+~]/.test(readFileSync(f, 'utf8')))
        expect(bad).toEqual([])
    })
})

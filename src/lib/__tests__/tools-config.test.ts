import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { toolsConfig } from '../tools-config'

describe('tool catalog', () => {
  const allTools = toolsConfig.flatMap((category) => category.tools)

  it('has unique category IDs, tool IDs, and routes', () => {
    expect(new Set(toolsConfig.map(({ id }) => id)).size).toBe(toolsConfig.length)
    expect(new Set(allTools.map(({ id }) => id)).size).toBe(allTools.length)
    expect(new Set(allTools.map(({ path }) => path)).size).toBe(allTools.length)
  })

  it('assigns every tool to its containing category and uses its ID in the route', () => {
    for (const category of toolsConfig) {
      for (const tool of category.tools) {
        expect(tool.category).toBe(category.id)
        expect(tool.path).toBe(`/tools/${tool.id}`)
      }
    }
  })

  it('has a page implementation for every catalog tool and no unlisted tool pages', () => {
    const pagesRoot = join(process.cwd(), 'src', 'app', '[locale]', 'tools')
    const pageIds = readdirSync(pagesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && readdirSync(join(pagesRoot, entry.name)).includes('page.tsx'))
      .map((entry) => entry.name)
      .sort()
    const configuredIds = allTools.map(({ id }) => id).sort()
    expect(pageIds).toEqual(configuredIds)
  })
})

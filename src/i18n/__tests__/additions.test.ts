import { describe, expect, it } from 'vitest'
import {
  extendMessages,
  loadAdditionalMessages,
  mergeMessages,
  messageAtPath,
} from '../additions'
import { locales } from '../config'
import { allTools, toolsConfig } from '@/lib/tools-config'
import { getSeoHead } from '@/seo/metadata'

const base = import.meta.glob('../messages/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, unknown>>
const groups = import.meta.glob('../messages/*-additions/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, unknown>>
function leaves(
  value: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      const path = prefix ? `${prefix}.${key}` : key
      return typeof entry === 'string'
        ? [[path, entry]]
        : entry && typeof entry === 'object' && !Array.isArray(entry)
          ? Object.entries(leaves(entry as Record<string, unknown>, path))
          : []
    }),
  )
}
const placeholders = (value: string) =>
  [...value.matchAll(/\{([a-zA-Z][\w]*)\}/g)].map((match) => match[1]).sort()

describe('expanded locale catalogs', () => {
  it('merges overrides without losing existing nested translations or accepting prototype keys', () => {
    const original = { tools: { demo: { name: 'Demo', kept: 'Existing' } } }
    expect(
      mergeMessages(original, { tools: { demo: { name: 'New' } } }),
    ).toEqual({ tools: { demo: { name: 'New', kept: 'Existing' } } })
    expect(original.tools.demo.name).toBe('Demo')
    expect(
      mergeMessages({}, JSON.parse('{"__proto__":{"polluted":true}}')),
    ).toEqual({})
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
  it.each(locales)(
    'provides names, descriptions and SEO for every tool in %s',
    async (locale) => {
      await loadAdditionalMessages(locale)
      const messages = extendMessages(
        locale,
        base[`../messages/${locale}.json`],
      )
      for (const category of toolsConfig) {
        expect(
          messageAtPath(messages, category.nameKey),
          `${locale}:${category.nameKey}`,
        ).toEqual(expect.any(String))
        expect(
          messageAtPath(messages, category.descriptionKey),
          `${locale}:${category.descriptionKey}`,
        ).toEqual(expect.any(String))
      }
      for (const tool of allTools) {
        for (const suffix of [
          'name',
          'description',
          'meta.title',
          'meta.description',
          'meta.keywords',
        ]) {
          expect(
            messageAtPath(messages, `tools.${tool.id}.${suffix}`),
            `${locale}:${tool.id}.${suffix}`,
          ).toEqual(expect.any(String))
        }
        const head = getSeoHead(locale, 'tools', tool.id, (key) =>
          String(messageAtPath(messages, key)),
        )
        expect(head.title).not.toContain('undefined')
        expect(
          head.tags.find((tag) => tag.attrs.name === 'description')?.attrs
            .content,
        ).toBeTruthy()
      }
    },
  )
  it('keeps addition keys and interpolation parameters aligned across all 12 languages', () => {
    const english = Object.keys(groups).filter((path) =>
      path.endsWith('/en.json'),
    )
    expect(english.length).toBeGreaterThanOrEqual(8)
    for (const path of english) {
      const expected = leaves(groups[path])
      for (const locale of locales) {
        const localizedPath = path.replace(/en\.json$/, `${locale}.json`)
        expect(groups[localizedPath], localizedPath).toBeDefined()
        const actual = leaves(groups[localizedPath])
        expect(Object.keys(actual).sort(), localizedPath).toEqual(
          Object.keys(expected).sort(),
        )
        for (const [key, value] of Object.entries(expected)) {
          expect(
            actual[key]?.trim().length,
            `${localizedPath}:${key}`,
          ).toBeGreaterThan(0)
          expect(placeholders(actual[key]), `${localizedPath}:${key}`).toEqual(
            placeholders(value),
          )
        }
      }
    }
  })
})

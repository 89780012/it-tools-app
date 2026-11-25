import { describe, expect, it } from 'vitest'
const dictionaries = import.meta.glob('../messages/frontend-additions/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, { tools: Record<string, Record<string, unknown>> }>
function leaves(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value }
  return Object.assign(
    {},
    ...Object.entries(value as Record<string, unknown>).map(([key, child]) =>
      leaves(child, `${prefix}.${key}`),
    ),
  )
}
describe('frontend additions translations', () => {
  it('provides complete, translated dictionaries with matching interpolation tokens in 12 locales', () => {
    const en = leaves(dictionaries['../messages/frontend-additions/en.json'])
    expect(Object.keys(dictionaries)).toHaveLength(12)
    for (const [path, dictionary] of Object.entries(dictionaries)) {
      const translated = leaves(dictionary)
      expect(Object.keys(translated).sort(), path).toEqual(
        Object.keys(en).sort(),
      )
      for (const [key, value] of Object.entries(translated)) {
        expect(value.trim().length, `${path}${key}`).toBeGreaterThan(0)
        expect(value.match(/\{\w+\}/g)?.sort(), `${path}${key}`).toEqual(
          en[key].match(/\{\w+\}/g)?.sort(),
        )
      }
      if (!path.endsWith('/en.json'))
        for (const id of Object.keys(dictionary.tools)) {
          expect(dictionary.tools[id].name, `${path} ${id}`).not.toBe(
            dictionaries['../messages/frontend-additions/en.json'].tools[id]
              .name,
          )
          expect(dictionary.tools[id].description, `${path} ${id}`).not.toBe(
            dictionaries['../messages/frontend-additions/en.json'].tools[id]
              .description,
          )
        }
    }
  })
})

import { describe, expect, it } from 'vitest'

const overlays = import.meta.glob(
  '../../i18n/messages/enhancement-additions/*.json',
  { eager: true, import: 'default' },
) as Record<string, { tools: Record<string, Record<string, string>> }>
const expectedLocales = [
  'en',
  'zh',
  'es',
  'de',
  'fr',
  'it',
  'pt',
  'ru',
  'ja',
  'ko',
  'ar',
  'hi',
]
const english = overlays['../../i18n/messages/enhancement-additions/en.json']
describe('enhancement translations', () => {
  it('ships all twelve locale overlays', () => {
    expect(
      Object.keys(overlays)
        .map((path) => path.split('/').pop()!.replace('.json', ''))
        .sort(),
    ).toEqual([...expectedLocales].sort())
  })
  it.each(Object.entries(overlays))(
    'has complete translated additions in %s',
    (path, overlay) => {
      expect(Object.keys(overlay.tools).sort()).toEqual([
        'curl-converter',
        'json-generator',
        'time-converter',
      ])
      for (const [tool, values] of Object.entries(overlay.tools)) {
        expect(Object.keys(values).sort()).toEqual(
          Object.keys(english.tools[tool]).sort(),
        )
        for (const value of Object.values(values)) {
          expect(typeof value).toBe('string')
          expect(value.trim().length).toBeGreaterThan(0)
        }
      }
      if (!path.endsWith('/en.json')) {
        for (const [tool, key] of [
          ['time-converter', 'extraDst'],
          ['curl-converter', 'extraSanitized'],
          ['json-generator', 'extraLimits'],
        ])
          expect(overlay.tools[tool][key]).not.toBe(english.tools[tool][key])
      }
    },
  )
})

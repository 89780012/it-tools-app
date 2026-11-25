import { describe, expect, it } from 'vitest'
import {
  detectDifferences,
  extractSamples,
  flattenJsonWithOrder,
  rebuildJson,
  type FlatEntry,
  type JsonObject,
} from '../json-key-fixer-utils'

describe('JSON key fixer utilities', () => {
  it('flattens nested objects and string arrays in source order', () => {
    expect(flattenJsonWithOrder({
      greeting: 'hello',
      nested: { title: 'world', ignored: 12 },
      items: ['one', 2, 'three'],
    })).toEqual([
      { path: 'greeting', value: 'hello', depth: 1, index: 0 },
      { path: 'nested.title', value: 'world', depth: 2, index: 1 },
      { path: 'items.0', value: 'one', depth: 2, index: 2 },
      { path: 'items.2', value: 'three', depth: 2, index: 3 },
    ])
  })

  it('flattens objects inside arrays and extracts a bounded sample', () => {
    const input: JsonObject = { entries: [{ label: 'first' }, { label: 'second' }] }
    expect(flattenJsonWithOrder(input).map(({ path }) => path)).toEqual(['entries.0.label', 'entries.1.label'])
    expect(extractSamples(input, 1)).toEqual(['first'])
    expect(extractSamples(input, 0)).toEqual([])
  })

  it('reports missing, extra, and reordered keys with a match rate', () => {
    const source: FlatEntry[] = [
      { path: 'a', value: 'A', depth: 1, index: 0 },
      { path: 'b', value: 'B', depth: 1, index: 1 },
      { path: 'c', value: 'C', depth: 1, index: 2 },
    ]
    const target: FlatEntry[] = [
      { path: 'b', value: 'B2', depth: 1, index: 0 },
      { path: 'a', value: 'A2', depth: 1, index: 1 },
      { path: 'extra', value: 'X', depth: 1, index: 2 },
    ]
    const result = detectDifferences(source, target)
    expect(result.stats).toEqual({ orderDiffCount: 2, missingKeys: ['c'], extraKeys: ['extra'], matchRate: 67 })
    expect(result.details.map(({ type }) => type)).toEqual(['order-diff', 'order-diff', 'missing', 'extra'])
  })

  it('does not report a reorder when missing keys merely shift the remaining indices', () => {
    const source: FlatEntry[] = [
      { path: 'missing', value: 'M', depth: 1, index: 0 },
      { path: 'kept', value: 'K', depth: 1, index: 1 },
    ]
    const target: FlatEntry[] = [{ path: 'kept', value: 'K', depth: 1, index: 0 }]
    expect(detectDifferences(source, target).stats.orderDiffCount).toBe(0)
  })

  it('rebuilds in source order, preserves existing values, translates missing keys and optionally retains extras', () => {
    const source: JsonObject = { first: 'source', nested: { title: 'title' }, last: 'last' }
    const target: JsonObject = { last: 'keep last', nested: { title: 'keep title', extra: true }, extra: 3 }
    expect(rebuildJson(source, target, { first: 'translated first' }, { keepExtraKeys: true })).toEqual({
      first: 'translated first',
      nested: { title: 'keep title', extra: true },
      last: 'keep last',
      extra: 3,
    })
    expect(rebuildJson({ first: 'source', missing: 'source' }, { first: '' }, { missing: 'translated' }, { keepExtraKeys: false })).toEqual({
      first: '',
      missing: 'translated',
    })
  })

  it('uses per-index translations for missing arrays and preserves scalar source values', () => {
    expect(rebuildJson(
      { list: ['one', 'two'], count: 2, enabled: true },
      {},
      { 'list.0': 'uno', 'list.1': 'dos' },
      { keepExtraKeys: false },
    )).toEqual({ list: ['uno', 'dos'], count: 2, enabled: true })
  })
})

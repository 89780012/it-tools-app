import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { allTools } from '../tools-config'
import {
  cleanToolIds,
  FAVORITES_KEY,
  readToolIds,
  RECENT_KEY,
  recordRecentTool,
  writeToolIds,
} from '../tool-preferences'

beforeEach(() => {
  localStorage.clear()
  writeToolIds(FAVORITES_KEY, [])
  writeToolIds(RECENT_KEY, [])
})
afterEach(() => vi.restoreAllMocks())

describe('tool preference persistence', () => {
  it('accepts only known unique tool IDs and enforces a limit', () => {
    expect(
      cleanToolIds(
        ['json-formatter', null, 123, 'missing', 'json-formatter', 'text-diff'],
        1,
      ),
    ).toEqual(['json-formatter'])
    expect(cleanToolIds({ id: 'json-formatter' })).toEqual([])
  })
  it('recovers damaged storage and persists metadata without input data', () => {
    localStorage.setItem(FAVORITES_KEY, '{broken')
    expect(readToolIds(FAVORITES_KEY)).toEqual({ ids: [], available: true })
    writeToolIds(FAVORITES_KEY, ['json-formatter', 'text-diff'])
    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)!)).toEqual([
      'json-formatter',
      'text-diff',
    ])
    expect(readToolIds(FAVORITES_KEY).ids).toEqual([
      'json-formatter',
      'text-diff',
    ])
  })
  it('keeps unique recent IDs ordered by latest access and caps history', () => {
    for (const tool of allTools.slice(0, 20)) recordRecentTool(tool.id)
    expect(readToolIds(RECENT_KEY).ids).toHaveLength(16)
    recordRecentTool(allTools[10].id)
    const recent = readToolIds(RECENT_KEY).ids
    expect(recent[0]).toBe(allTools[10].id)
    expect(recent.filter((id) => id === allTools[10].id)).toHaveLength(1)
    recordRecentTool('does-not-exist')
    expect(readToolIds(RECENT_KEY).ids).toEqual(recent)
  })
  it('uses memory when storage can be read but quota prevents writes', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })
    expect(writeToolIds(FAVORITES_KEY, ['text-diff'])).toBe(false)
    expect(readToolIds(FAVORITES_KEY)).toEqual({
      ids: ['text-diff'],
      available: false,
    })
  })
  it('continues in memory when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Disabled')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Disabled')
    })
    expect(writeToolIds(FAVORITES_KEY, ['regex-tester'])).toBe(false)
    expect(readToolIds(FAVORITES_KEY)).toEqual({
      ids: ['regex-tester'],
      available: false,
    })
  })
})

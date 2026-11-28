import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  JsonKeySortError,
  sortJsonKeys,
  SORT_MAX_INPUT,
  SORT_MAX_DEPTH,
} from '../json-key-sorter'
const compact = { order: 'asc', indent: 'compact' } as const
const run = (source: string) => sortJsonKeys(source, compact)
function error(source: string, code: JsonKeySortError['code']) {
  try {
    run(source)
    throw new Error('Expected validation failure')
  } catch (caught) {
    expect(caught).toBeInstanceOf(JsonKeySortError)
    expect((caught as JsonKeySortError).code).toBe(code)
  }
}
describe('JSON key sorting', () => {
  it('sorts every object, including objects in arrays, without reordering array elements', () => {
    expect(
      run('{"z":1,"a":[3,{"z":2,"a":1},null,[],{}],"b":{"y":0,"x":false}}'),
    ).toEqual({
      output: '{"a":[3,{"a":1,"z":2},null,[],{}],"b":{"x":false,"y":0},"z":1}',
      objects: 4,
      keys: 7,
    })
  })
  it('sorts integer-looking keys lexically and descending at every depth', () => {
    const source = '{"2":2,"10":10,"a":{"1":1,"20":20,"3":3}}'
    expect(run(source).output).toBe('{"10":10,"2":2,"a":{"1":1,"20":20,"3":3}}')
    expect(sortJsonKeys(source, { ...compact, order: 'desc' }).output).toBe(
      '{"a":{"3":3,"20":20,"1":1},"2":2,"10":10}',
    )
  })
  it('uses case-sensitive UTF-16 order for decoded keys, including supplementary characters', () => {
    expect(
      run('{"é":1,"a":2,"Z":3,"\\u0062":4,"😀":5,"\ue000":6,"":7}').output,
    ).toBe('{"":7,"Z":3,"a":2,"b":4,"é":1,"😀":5,"\ue000":6}')
  })
  it('preserves number precision, spelling, negative zero and extreme exponents', () => {
    const source =
      '[9007199254740993123456789,0.1234567890123456789,1E+9999,-0,-0.00,1.2300e-99]'
    expect(run(source).output).toBe(source)
  })
  it('treats prototype-related keys as data and never pollutes prototypes', () => {
    const source =
      '{"constructor":{"prototype":{"polluted":true}},"__proto__":{"z":1,"a":2}}'
    expect(run(source).output).toBe(
      '{"__proto__":{"a":2,"z":1},"constructor":{"prototype":{"polluted":true}}}',
    )
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
  it.each(['null', 'true', 'false', '42', '"hello"', '[]', '{}', '"\\ud800"'])(
    'accepts scalar and empty roots: %s',
    (source) => {
      expect(run(source).output).toBe(source)
    },
  )
  it('emits valid two-space and four-space indentation', () => {
    expect(
      sortJsonKeys('{"z":[],"a":[1,{"b":true}]}', { order: 'asc', indent: '2' })
        .output,
    ).toBe(
      '{\n  "a": [\n    1,\n    {\n      "b": true\n    }\n  ],\n  "z": []\n}',
    )
    expect(
      sortJsonKeys('{"b":1,"a":2}', { order: 'asc', indent: '4' }).output,
    ).toBe('{\n    "a": 2,\n    "b": 1\n}')
  })
  it.each(['', ' \t\r\n'])('rejects empty input: %j', (source) =>
    error(source, 'empty'),
  )
  it.each([
    'undefined',
    'NaN',
    '{"a":1,}',
    '[1,]',
    '{"a":01}',
    '{}{}',
    '{"a":"bad\nstring"}',
    '\ufeff{}',
    '{a:1}',
  ])('rejects invalid JSON: %j', (source) => error(source, 'invalidJson'))
  it.each([
    '{"a":1,"a":1}',
    '{"a":1,"a":2}',
    '{"a":1,"\\u0061":1}',
    '[{"nested":{"x":[],"x":[]}}]',
  ])('rejects duplicate keys: %s', (source) => error(source, 'duplicateKey'))
  it('distinguishes key scopes and strings with brackets, colons and escapes', () => {
    const source = '{"z":{"a":1},"a":{"a":"[\\\"x\\\"]: {} \\\\"}}'
    expect(JSON.parse(run(source).output)).toEqual(JSON.parse(source))
  })
  it('accepts exact size limit and rejects the next UTF-16 unit', () => {
    const source = '"' + 'x'.repeat(SORT_MAX_INPUT - 2) + '"'
    expect(run(source).output).toBe(source)
    error(source + ' ', 'inputLimit')
  })
  it('accepts exactly 64 container levels, ignores bracket text and rejects level 65', () => {
    const source =
      '['.repeat(SORT_MAX_DEPTH) + '"{[}]"' + ']'.repeat(SORT_MAX_DEPTH)
    expect(run(source).output).toBe(source)
    error('[' + source + ']', 'depthLimit')
  })
  it('bounds expanded output and allows recovery using compact output', () => {
    const source =
      '['.repeat(63) +
      '[' +
      Array(8000).fill('0').join(',') +
      ']' +
      ']'.repeat(63)
    expect(run(source).output).toBe(source)
    expect(() =>
      sortJsonKeys(source, { order: 'asc', indent: '4' }),
    ).not.toThrow()
    const large =
      '['.repeat(63) +
      '[' +
      Array(20000).fill('0').join(',') +
      ']' +
      ']'.repeat(63)
    try {
      sortJsonKeys(large, { order: 'asc', indent: '4' })
      throw new Error('Expected output limit')
    } catch (caught) {
      expect(caught).toMatchObject({ code: 'outputLimit' })
    }
    expect(run(large).output).toBe(large)
  })
  it('preserves JSON values and produces idempotent results for arbitrary documents', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        const source = JSON.stringify(value)
        const sorted = run(source).output
        expect(JSON.parse(sorted)).toEqual(JSON.parse(source))
        expect(run(sorted).output).toBe(sorted)
      }),
      { numRuns: 100 },
    )
  })
})

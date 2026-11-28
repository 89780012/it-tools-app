import { describe, expect, it } from 'vitest'
import {
  applyJsonMergePatch,
  MergePatchError,
  MERGE_PATCH_MAX_DEPTH,
  MERGE_PATCH_MAX_INPUT,
} from '../json-merge-patch'

describe('RFC 7396 Appendix A vectors', () => {
  const vectors = [
    ['{"a":"b"}', '{"a":"c"}', '{"a":"c"}'],
    ['{"a":"b"}', '{"b":"c"}', '{"a":"b","b":"c"}'],
    ['{"a":"b"}', '{"a":null}', '{}'],
    ['{"a":"b","b":"c"}', '{"a":null}', '{"b":"c"}'],
    ['{"a":["b"]}', '{"a":"c"}', '{"a":"c"}'],
    ['{"a":"c"}', '{"a":["b"]}', '{"a":["b"]}'],
    ['{"a":{"b":"c"}}', '{"a":{"b":"d","c":null}}', '{"a":{"b":"d"}}'],
    ['{"a":[{"b":"c"}]}', '{"a":[1]}', '{"a":[1]}'],
    ['["a","b"]', '["c","d"]', '["c","d"]'],
    ['{"a":"b"}', '["c"]', '["c"]'],
    ['{"a":"foo"}', 'null', 'null'],
    ['{"a":"foo"}', '"bar"', '"bar"'],
    ['{"e":null}', '{"a":1}', '{"e":null,"a":1}'],
    ['[1,2]', '{"a":"b","c":null}', '{"a":"b"}'],
    ['{}', '{"a":{"bb":{"ccc":null}}}', '{"a":{"bb":{}}}'],
  ]
  it.each(vectors)('merges %s with %s', (target, patch, expected) => {
    expect(JSON.parse(applyJsonMergePatch(target, patch))).toEqual(
      JSON.parse(expected),
    )
  })
})

describe('merge patch validation and boundaries', () => {
  function error(target: string, patch: string, code: string, field: string) {
    try {
      applyJsonMergePatch(target, patch)
      expect.unreachable('expected validation error')
    } catch (caught) {
      expect(caught).toBeInstanceOf(MergePatchError)
      expect(caught).toMatchObject({ code, field })
    }
  }
  it('retains large integers, decimal digits, exponents and negative zero', () => {
    const result = applyJsonMergePatch(
      '{"id":9007199254740993,"price":0.1234567890123456789}',
      '{"added":1e400,"zero":-0}',
    )
    for (const number of [
      '9007199254740993',
      '0.1234567890123456789',
      '1e400',
      '-0',
    ])
      expect(result).toContain(number)
    expect(applyJsonMergePatch('{}', '9007199254740993')).toBe(
      '9007199254740993',
    )
  })
  it('keeps false, zero, empty strings, null array members and empty keys', () => {
    expect(
      JSON.parse(
        applyJsonMergePatch(
          '{"keep":null}',
          '{"":0,"false":false,"s":"","a":[null]}',
        ),
      ),
    ).toEqual({ keep: null, '': 0, false: false, s: '', a: [null] })
    expect(applyJsonMergePatch('1', '{}')).toBe('{}')
    expect(applyJsonMergePatch('null', 'false')).toBe('false')
  })
  it('treats prototype-like keys as ordinary JSON data without inherited fields', () => {
    const target = '{"__proto__":{"keep":1},"constructor":{"old":true}}'
    const patch =
      '{"__proto__":{"polluted":true},"constructor":{"prototype":{"safe":true}},"toString":{"own":true}}'
    const output = JSON.parse(applyJsonMergePatch(target, patch))
    expect(output).toEqual(
      JSON.parse(
        '{"__proto__":{"keep":1,"polluted":true},"constructor":{"old":true,"prototype":{"safe":true}},"toString":{"own":true}}',
      ),
    )
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(
      JSON.parse(applyJsonMergePatch(target, '{"__proto__":null}')),
    ).not.toHaveProperty('__proto__.keep')
    expect(
      JSON.parse(
        applyJsonMergePatch('{}', '{"isLosslessNumber":true,"value":"42"}'),
      ),
    ).toEqual({ isLosslessNumber: true, value: '42' })
  })
  it.each([
    '',
    ' \n\t',
    '{bad}',
    '{"a":1,}',
    'NaN',
    'undefined',
    '{"a":1,"a":2}',
    '01',
    'true false',
    '[1',
  ])('identifies invalid input %j on either side', (source) => {
    const code = /^[\x20\t\r\n]*$/.test(source) ? 'empty' : 'invalid'
    error(source, '{}', code, 'target')
    error('{}', source, code, 'patch')
  })
  it('accepts exactly the input limit and rejects the next code unit', () => {
    const source = '"' + 'a'.repeat(MERGE_PATCH_MAX_INPUT - 2) + '"'
    expect(applyJsonMergePatch('null', source)).toBe(source)
    error(source + ' ', '{}', 'tooLarge', 'target')
    error('{}', source + ' ', 'tooLarge', 'patch')
  })
  it('accepts the depth limit and ignores escaped quotes and brackets in strings', () => {
    const source =
      '['.repeat(MERGE_PATCH_MAX_DEPTH) +
      '0' +
      ']'.repeat(MERGE_PATCH_MAX_DEPTH)
    expect(JSON.parse(applyJsonMergePatch('{}', source))).toEqual(
      JSON.parse(source),
    )
    error('{}', '[' + source + ']', 'tooDeep', 'patch')
    error('[' + source + ']', '{}', 'tooDeep', 'target')
    const text = JSON.stringify('"\\' + '['.repeat(100))
    expect(applyJsonMergePatch('{}', text)).toBe(text)
  })
  it('rejects excessive formatted output rather than returning a partial document', () => {
    const source =
      '['.repeat(63) +
      '[' +
      Array(80_000).fill('0').join(',') +
      ']' +
      ']'.repeat(63)
    error('{}', source, 'outputLimit', 'output')
  })
})

import { describe, expect, it } from 'vitest'
import {
  convertJsonLines,
  JsonLinesError,
  JSON_LINES_MAX_BYTES,
  JSON_LINES_MAX_DEPTH,
  JSON_LINES_MAX_RECORDS,
} from '../json-lines'

describe('JSON Lines conversion', () => {
  it('converts mixed values, escaped newlines and nested arrays in both directions', () => {
    const data = [
      { text: '你好\n🌍', nested: { ok: false } },
      null,
      0,
      false,
      '',
      [1, 2],
    ]
    const lines = convertJsonLines(JSON.stringify(data), 'toLines')
    expect(lines.records).toBe(6)
    expect(lines.output.split('\n')).toHaveLength(7)
    expect(lines.output.endsWith('\n')).toBe(true)
    const json = convertJsonLines(lines.output, 'toJson', false)
    expect(JSON.parse(json.output)).toEqual(data)
    expect(json).toMatchObject({ records: 6, skipped: 0 })
  })

  it('preserves large integers, decimals, exponents and negative zero exactly', () => {
    const numbers = '9007199254740993,0.123456789012345678901,1e400,1e-400,-0'
    const lines = convertJsonLines(`[${numbers}]`, 'toLines')
    expect(lines.output).toBe(numbers.replaceAll(',', '\n') + '\n')
    expect(convertJsonLines(lines.output, 'toJson').output).toBe(
      '[\n  ' + numbers.replaceAll(',', ',\n  ') + '\n]',
    )
  })

  it('accepts BOM, CRLF, a final newline and counts skipped physical blank lines', () => {
    expect(
      convertJsonLines('\uFEFF\r\n{"a":1}\r\n \t\r\nnull\r\n', 'toJson'),
    ).toEqual({ output: '[\n  {"a":1},\n  null\n]', records: 2, skipped: 2 })
    expect(convertJsonLines('\uFEFF[true]', 'toLines').output).toBe('true\n')
    expect(convertJsonLines('false\r\n', 'toJson', false).records).toBe(1)
  })

  it('reports original physical line numbers and rejects blank lines in strict mode', () => {
    expect(() => convertJsonLines('{}\n\n{bad}\n', 'toJson')).toThrow(
      expect.objectContaining({ code: 'invalidLine', line: 3 }),
    )
    expect(() => convertJsonLines('{}\n \nnull\n', 'toJson', false)).toThrow(
      expect.objectContaining({ code: 'blankLine', line: 2 }),
    )
    expect(() => convertJsonLines('{}\n\n', 'toJson', false)).toThrow(
      expect.objectContaining({ code: 'blankLine', line: 2 }),
    )
  })

  it.each(['', ' \t\r\n', '\uFEFF\n'])('rejects empty input %j', (input) => {
    expect(() => convertJsonLines(input, 'toJson')).toThrow(
      new JsonLinesError('empty'),
    )
    expect(() => convertJsonLines(input, 'toLines')).toThrow(
      new JsonLinesError('empty'),
    )
  })

  it.each(['{}', 'null', 'false', '"text"', '42'])(
    'requires an array for JSON input %s',
    (input) => {
      expect(() => convertJsonLines(input, 'toLines')).toThrow(
        new JsonLinesError('expectedArray'),
      )
    },
  )

  it.each([
    '[1,]',
    '[NaN]',
    '[undefined]',
    '[01]',
    '[/*comment*/1]',
    '[{"a":1,"a":2}]',
    '["\n"]',
    '[1] [2]',
  ])('rejects malformed JSON and conflicting duplicate keys: %s', (input) => {
    expect(() => convertJsonLines(input, 'toLines')).toThrow(
      new JsonLinesError('invalidJson'),
    )
  })

  it.each(['{} {}', '{\n"a":1\n}', '\u00a0{}', '{"a":1,"a":2}', 'NaN'])(
    'rejects malformed JSON Lines: %s',
    (input) => {
      expect(() => convertJsonLines(input, 'toJson')).toThrow(
        new JsonLinesError('invalidLine'),
      )
    },
  )

  it('retains prototype-like object keys without polluting objects', () => {
    const source =
      '[{"__proto__":{"polluted":true},"constructor":0,"prototype":false}]'
    const output = convertJsonLines(source, 'toLines').output
    expect(output).toBe(source.slice(1, -1) + '\n')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('represents an empty array as a successful empty file', () => {
    expect(convertJsonLines('[]', 'toLines')).toEqual({
      output: '',
      records: 0,
      skipped: 0,
    })
  })

  it('enforces the actual UTF-8 byte limit, including exact boundary input', () => {
    const boundary = '["' + 'a'.repeat(JSON_LINES_MAX_BYTES - 4) + '"]'
    expect(convertJsonLines(boundary, 'toLines').records).toBe(1)
    expect(() => convertJsonLines(boundary + ' ', 'toLines')).toThrow(
      new JsonLinesError('tooLarge'),
    )
    const unicode =
      '["' + '界'.repeat(Math.ceil(JSON_LINES_MAX_BYTES / 3)) + '"]'
    expect(unicode.length).toBeLessThan(JSON_LINES_MAX_BYTES)
    expect(() => convertJsonLines(unicode, 'toLines')).toThrow(
      new JsonLinesError('tooLarge'),
    )
  })

  it('enforces record limits in both directions', () => {
    const lines = 'null\n'.repeat(JSON_LINES_MAX_RECORDS)
    expect(convertJsonLines(lines, 'toJson').records).toBe(
      JSON_LINES_MAX_RECORDS,
    )
    expect(() => convertJsonLines(lines + 'null', 'toJson')).toThrow(
      new JsonLinesError('tooManyRecords'),
    )
    const json = '[' + Array(JSON_LINES_MAX_RECORDS).fill('0').join(',') + ']'
    expect(convertJsonLines(json, 'toLines').records).toBe(
      JSON_LINES_MAX_RECORDS,
    )
    expect(() =>
      convertJsonLines(json.slice(0, -1) + ',0]', 'toLines'),
    ).toThrow(new JsonLinesError('tooManyRecords'))
  })

  it('bounds nesting without counting brackets or escaped quotes inside strings', () => {
    const boundary =
      '['.repeat(JSON_LINES_MAX_DEPTH) + '0' + ']'.repeat(JSON_LINES_MAX_DEPTH)
    expect(convertJsonLines(boundary, 'toLines').records).toBe(1)
    expect(convertJsonLines(boundary, 'toJson').records).toBe(1)
    expect(() => convertJsonLines('[' + boundary + ']', 'toLines')).toThrow(
      new JsonLinesError('tooDeep'),
    )
    expect(() => convertJsonLines('[' + boundary + ']', 'toJson')).toThrow(
      new JsonLinesError('tooDeep'),
    )
    const text =
      '[{"\\"\\\\' + '['.repeat(101) + '":"' + ']'.repeat(101) + '"}]'
    expect(convertJsonLines(text, 'toLines').records).toBe(1)
  })
})

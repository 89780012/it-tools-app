import { describe, expect, it, vi } from 'vitest'
import {
  formatInZone,
  parseExtendedDate,
  timestampToMs,
} from '../time-extended'
import {
  generateEnhancedData,
  ENHANCED_FIELD_TYPES,
} from '../json-generator-enhanced'
import {
  generateEnhancedCode,
  parseEnhancedCurl,
  sanitizeEnhancedTemplate,
} from '../curl-enhanced'

const options = {
  seed: 'repeatable',
  locale: 'en' as const,
  boundary: false,
  nullRatio: 0,
}
describe('extended time conversion', () => {
  it('uses explicit units at small and large timestamps', () => {
    expect(timestampToMs('1700000000', 'seconds')).toBe(1700000000000)
    expect(timestampToMs('1700000000', 'milliseconds')).toBe(1700000000)
    expect(timestampToMs('-1', 'seconds')).toBe(-1000)
    for (const input of [
      '1.1',
      'Infinity',
      '1e3',
      '9007199254740992',
      '8640000000000001',
    ])
      expect(() => timestampToMs(input, 'milliseconds')).toThrow()
  })
  it('parses ISO offsets independently of selected zone and preserves fractions', () => {
    expect(
      parseExtendedDate('2024-02-29T12:34:56.123+08:00', 'America/New_York'),
    ).toBe(Date.parse('2024-02-29T04:34:56.123Z'))
    expect(parseExtendedDate('2024-02-29 12:34:56.123', 'UTC')).toBe(
      Date.parse('2024-02-29T12:34:56.123Z'),
    )
    expect(formatInZone(0, 'Asia/Shanghai')).toBe('1970-01-01 08:00:00')
    expect(
      Number.isFinite(parseExtendedDate('2025-01-01 00:00:00', 'local')),
    ).toBe(true)
    expect(formatInZone(-8640000000000000, 'UTC')).toBe(
      '-271821-04-20 00:00:00',
    )
    expect(formatInZone(8640000000000000, 'UTC')).toBe('+275760-09-13 00:00:00')
  })
  it.each([
    '2023-02-29 00:00:00',
    '2024-04-31 00:00:00',
    '2024-00-01 00:00:00',
    '2024-01-00 00:00:00',
    '2024-01-01 24:00:00',
    '2024-01-01T00:00:60Z',
    '2024-01-01T00:00:00+24:00',
    '2024-01-01T00:00:00+00:60',
    '2024-01-01',
    'not a date',
  ])('rejects invalid dates: %s', (input) =>
    expect(() => parseExtendedDate(input, 'UTC')).toThrow(),
  )
  it('rejects invalid zones even when input carries an offset', () => {
    expect(() =>
      parseExtendedDate('2025-01-01T00:00:00Z', 'Invalid/Zone'),
    ).toThrow()
    expect(() => formatInZone(0, 'Invalid/Zone')).toThrow()
  })
  it('rejects DST gaps and chooses the earlier instant in folds', () => {
    expect(() =>
      parseExtendedDate('2024-03-10 02:30:00', 'America/New_York'),
    ).toThrow()
    expect(parseExtendedDate('2024-11-03 01:30:00', 'America/New_York')).toBe(
      Date.parse('2024-11-03T05:30:00Z'),
    )
    expect(() =>
      parseExtendedDate('2024-10-06 02:15:00', 'Australia/Lord_Howe'),
    ).toThrow()
    const start = parseExtendedDate('2024-03-10 00:00:00', 'America/New_York')
    const end = parseExtendedDate('2024-03-11 00:00:00', 'America/New_York')
    expect(end - start).toBe(23 * 3600000)
  })
})

describe('deterministic bounded JSON data', () => {
  const fields = ENHANCED_FIELD_TYPES.map((type) => ({
    name: type,
    type,
    count: 7,
    min: -2,
    max: 2,
  }))
  it('repeats every field with the same seed and changes with another seed', () => {
    const first = generateEnhancedData(fields, 20, options)
    expect(generateEnhancedData(fields, 20, options)).toEqual(first)
    expect(
      generateEnhancedData(fields, 20, { ...options, seed: 'different' }),
    ).not.toEqual(first)
    expect(first).toHaveLength(20)
    for (const row of first) {
      expect(row.string).toHaveLength(7)
      expect(row.array).toHaveLength(7)
      expect(row.number).toBeGreaterThanOrEqual(-2)
      expect(row.number).toBeLessThanOrEqual(2)
    }
  })
  it('alternates exact boundaries and preserves zero lengths and zero bounds', () => {
    expect(
      generateEnhancedData(
        [
          { name: 'n', type: 'number', min: -5, max: 0 },
          { name: 's', type: 'string', count: 0 },
          { name: 'a', type: 'array', count: 0 },
        ],
        3,
        { ...options, boundary: true },
      ),
    ).toEqual([
      { n: -5, s: '', a: [] },
      { n: 0, s: '', a: [] },
      { n: -5, s: '', a: [] },
    ])
  })
  it('generates Chinese names, addresses and strings', () => {
    const [row] = generateEnhancedData(
      [
        { name: 'name', type: 'name' },
        { name: 'address', type: 'address' },
        { name: 's', type: 'string', count: 12 },
      ],
      1,
      { ...options, locale: 'zh' },
    )
    expect(row.name).toMatch(/[\u4e00-\u9fff]/)
    expect(row.address).toMatch(/[\u4e00-\u9fff]/)
    expect(row.s).toMatch(/^[\u4e00-\u9fff]{12}$/)
  })
  it('honors null probability endpoints and rejects outside bounds', () => {
    expect(
      generateEnhancedData([{ name: 'x', type: 'number' }], 100, {
        ...options,
        nullRatio: 1,
      }).every((row) => row.x === null),
    ).toBe(true)
    expect(
      generateEnhancedData([{ name: 'x', type: 'number' }], 100, options).every(
        (row) => row.x !== null,
      ),
    ).toBe(true)
    for (const nullRatio of [-0.1, 1.1, NaN, Infinity])
      expect(() =>
        generateEnhancedData(fields, 1, { ...options, nullRatio }),
      ).toThrow()
  })
  it('accepts exact row limit and rejects excessive work before allocation', () => {
    expect(
      generateEnhancedData([{ name: 'n', type: 'number' }], 1000, options),
    ).toHaveLength(1000)
    for (const count of [0, -1, 1.5, 1001, Infinity])
      expect(() => generateEnhancedData(fields, count, options)).toThrow()
    for (const count of [-1, 1.5, 1001, Infinity])
      expect(() =>
        generateEnhancedData(
          [{ name: 'x', type: 'string', count }],
          1,
          options,
        ),
      ).toThrow()
    expect(() =>
      generateEnhancedData(
        Array.from({ length: 50 }, (_, i) => ({
          name: String(i),
          type: 'array',
          count: 1000,
        })),
        1000,
        options,
      ),
    ).toThrow()
    expect(() =>
      generateEnhancedData(
        [{ name: 'x', type: 'number', min: 2, max: 1 }],
        1,
        options,
      ),
    ).toThrow()
    expect(() =>
      generateEnhancedData(
        [
          { name: 'x', type: 'string' },
          { name: 'x', type: 'string' },
        ],
        1,
        options,
      ),
    ).toThrow()
  })
})

describe('curl parser, escaping and storage', () => {
  it('preserves mixed quoted values, newlines and explicit methods', () => {
    const parsed = parseEnhancedCurl(
      `curl 'https://example.com/a?q=two%20words' -X PATCH -H "X-Name: O'Reilly" --data-raw '{"name":"O'"'"'Reilly","value":"a b"}'`,
    )
    expect(parsed.method).toBe('PATCH')
    expect(parsed.headers['X-Name']).toBe("O'Reilly")
    expect(parsed.data).toBe('{"name":"O\'Reilly","value":"a b"}')
    expect(
      parseEnhancedCurl('curl \\\n https://example.com --data "line1\nline2"')
        .data,
    ).toBe('line1\nline2')
    expect(
      parseEnhancedCurl('curl https://example.com -X GET -d a=1').method,
    ).toBe('GET')
  })
  it('supports attached flags, URL option, repeated data and duplicate GET query keys', () => {
    const parsed = parseEnhancedCurl(
      'curl --url=https://example.com -XPOST -H"X-Test: yes" -d a=1 --data-raw=b=2',
    )
    expect(parsed).toMatchObject({
      method: 'POST',
      headers: { 'X-Test': 'yes' },
      data: 'a=1&b=2',
    })
    expect(
      new URL(
        parseEnhancedCurl('curl https://example.com -G -d a=1 -d a=2').url,
      ).searchParams.getAll('a'),
    ).toEqual(['1', '2'])
  })
  it.each([
    'echo curl https://example.com',
    'curl "https://example.com',
    'curl https://example.com --unknown',
    'curl file:///tmp/a',
    'curl https://user:pass@example.com',
    'curl https://example.com -d @file',
    'curl https://example.com -H "Bad header: x"',
    'curl https://example.com -X TRACE',
  ])('rejects invalid or unsupported inputs: %s', (input) =>
    expect(() => parseEnhancedCurl(input)).toThrow(),
  )
  it('generates JavaScript that sends exact quoted content without evaluating it', async () => {
    const request = {
      url: 'https://example.com/?q="',
      method: 'POST',
      headers: { 'X-Value': "O'Reilly \\ path" },
      data: '"\\\n` ${alert(1)}',
    }
    const fetchMock = vi.fn().mockResolvedValue({ text: async () => 'fixture' })
    new Function(
      'fetch',
      'console',
      generateEnhancedCode(request, 'javascript'),
    )(fetchMock, { log: vi.fn(), error: vi.fn() })
    expect(fetchMock).toHaveBeenCalledWith(request.url, {
      method: 'POST',
      headers: request.headers,
      body: request.data,
    })
    const nodeCode = generateEnhancedCode(request, 'nodejs')
    const axios = vi.fn().mockResolvedValue({ data: 'fixture' })
    new Function('require', 'console', nodeCode)(() => axios, {
      log: vi.fn(),
      error: vi.fn(),
    })
    expect(axios).toHaveBeenCalledWith({
      method: 'POST',
      url: request.url,
      headers: request.headers,
      data: request.data,
    })
    expect(generateEnhancedCode(request, 'go')).toContain(
      `strings.NewReader(${JSON.stringify(request.data)})`,
    )
    expect(generateEnhancedCode(request, 'php')).toContain("O\\'Reilly")
    expect(generateEnhancedCode(request, 'python')).toContain(
      `data=${JSON.stringify(request.data)}`,
    )
  })
  it('drops request secrets from all storage locations', () => {
    const request = {
      url: 'https://example.com/secret-path?api_key=secret-query#secret-fragment',
      method: 'POST',
      headers: {
        Authorization: 'Bearer secret-auth',
        Cookie: 'session=secret-cookie',
        'X-Whatever': 'secret-token',
      },
      data: '{"password":"secret-body"}',
    }
    const saved = sanitizeEnhancedTemplate(request)
    expect(saved).toEqual({
      url: 'https://example.com',
      method: 'POST',
      headers: {},
    })
    expect(JSON.stringify(saved)).not.toContain('secret')
  })
})

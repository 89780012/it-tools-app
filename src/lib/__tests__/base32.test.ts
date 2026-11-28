import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  Base32Error,
  convertBase32,
  decodeBase32,
  encodeBase32,
  MAX_BASE32_INPUT,
  type Base32Options,
  type Base32ErrorCode,
} from '../base32'

const defaults: Base32Options = {
  operation: 'encode',
  representation: 'text',
  variant: 'standard',
  padding: true,
}
const convert = (text: string, patch: Partial<Base32Options> = {}) =>
  convertBase32(text, { ...defaults, ...patch })
function fails(
  text: string,
  code: Base32ErrorCode,
  patch: Partial<Base32Options> = {},
) {
  try {
    convert(text, patch)
    expect.fail('Expected conversion failure')
  } catch (error) {
    expect(error).toBeInstanceOf(Base32Error)
    expect((error as Base32Error).code).toBe(code)
  }
}
// RFC 4648 section 10: fixed, independently published test vectors.
const vectors = [
  ['', '', ''],
  ['f', 'MY======', 'CO======'],
  ['fo', 'MZXQ====', 'CPNG===='],
  ['foo', 'MZXW6===', 'CPNMU==='],
  ['foob', 'MZXW6YQ=', 'CPNMUOG='],
  ['fooba', 'MZXW6YTB', 'CPNMUOJ1'],
  ['foobar', 'MZXW6YTBOI======', 'CPNMUOJ1E8======'],
]
describe('RFC 4648 Base32', () => {
  it.each(vectors)(
    'encodes and decodes RFC vector %j with both alphabets',
    (text, standard, hex) => {
      for (const [variant, expected] of [
        ['standard', standard],
        ['hex', hex],
      ] as const) {
        const bytes = new TextEncoder().encode(text)
        expect(encodeBase32(bytes, variant, true)).toBe(expected)
        expect(encodeBase32(bytes, variant, false)).toBe(
          expected.replace(/=/g, ''),
        )
        expect(Array.from(decodeBase32(expected, variant))).toEqual(
          Array.from(bytes),
        )
        expect(
          Array.from(
            decodeBase32(expected.toLowerCase().replace(/=/g, ''), variant),
          ),
        ).toEqual(Array.from(bytes))
      }
    },
  )
  it('round trips random bytes for both alphabets with and without padding', () => {
    fc.assert(
      fc.property(fc.uint8Array({ maxLength: 2048 }), (bytes) => {
        for (const variant of ['standard', 'hex'] as const)
          for (const padding of [true, false]) {
            const encoded = encodeBase32(bytes, variant, padding)
            expect(decodeBase32(encoded, variant)).toEqual(bytes)
            expect(
              encodeBase32(decodeBase32(encoded, variant), variant, padding),
            ).toBe(encoded)
          }
      }),
      { seed: 4648, numRuns: 300 },
    )
  })
  it('matches an independent bit-string oracle for all single-byte values', () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    for (let byte = 0; byte <= 255; byte++) {
      const bits = byte.toString(2).padStart(8, '0').padEnd(10, '0')
      expect(encodeBase32(Uint8Array.of(byte), 'standard', false)).toBe(
        alphabet[parseInt(bits.slice(0, 5), 2)] +
          alphabet[parseInt(bits.slice(5), 2)],
      )
    }
  })
  it('preserves Unicode, BOM, nulls and all text whitespace', () => {
    for (const text of [
      '中文 é 👩‍💻',
      '\ufeffhello',
      '\x00',
      ' \t\n\r',
      'e\u0301',
    ]) {
      const encoded = convert(text)
      expect(encoded.bytes).toBe(new TextEncoder().encode(text).length)
      expect(convert(encoded.output, { operation: 'decode' }).output).toBe(text)
    }
  })
  it('decodes lowercase and ASCII whitespace without changing text bytes', () => {
    expect(
      convert(' \tmz\nxw6y\rtboi\v\f====== ', { operation: 'decode' }),
    ).toEqual({ output: 'foobar', bytes: 6 })
  })
  it('supports arbitrary binary bytes through hex representation', () => {
    expect(convert('00 fF\n80', { representation: 'hex' })).toEqual({
      output: 'AD7YA===',
      bytes: 3,
    })
    expect(
      convert('AD7YA===', { operation: 'decode', representation: 'hex' }),
    ).toEqual({ output: '00ff80', bytes: 3 })
    fails('AD7YA===', 'invalidUtf8', { operation: 'decode' })
    for (const bytes of [
      [0xc0, 0x80],
      [0xed, 0xa0, 0x80],
      [0xf4, 0x90, 0x80, 0x80],
      [0xe2, 0x82],
    ]) {
      fails(
        encodeBase32(Uint8Array.from(bytes), 'standard', true),
        'invalidUtf8',
        { operation: 'decode' },
      )
    }
  })
  it.each(['0', '0x66', '66,6f', 'gg', '６６', '66\u00a06f'])(
    'rejects invalid hex %j',
    (text) => fails(text, 'invalidHex', { representation: 'hex' }),
  )
  it.each(['0A', '1A', '8A', '9A', 'A-', 'ßA', 'ＡＡ', 'AA\u00a0', 'AA💡'])(
    'rejects characters outside standard alphabet: %j',
    (text) => fails(text, 'invalidCharacters', { operation: 'decode' }),
  )
  it.each(['WA', 'ZA', 'w0', 'ß0'])(
    'rejects characters outside hex alphabet: %j',
    (text) =>
      fails(text, 'invalidCharacters', { operation: 'decode', variant: 'hex' }),
  )
  it.each(['A', 'AAA', 'AAAAAA', 'AAAAAAAAA'])(
    'rejects impossible symbol lengths %j',
    (text) => fails(text, 'invalidLength', { operation: 'decode' }),
  )
  it.each([
    'MY=',
    'MY=====',
    'MY=======',
    'MY========',
    'M=Y=====',
    '=MY=====',
    '========',
    'MZXW6YTB=',
    'MY======A',
  ])('rejects incorrect or misplaced padding %j', (text) =>
    fails(text, 'invalidPadding', { operation: 'decode' }),
  )
  it.each(['MZ======', 'MZ', 'MZXR====', 'MZXW7===', 'MZXW6YR='])(
    'rejects nonzero unused trailing bits %j',
    (text) => fails(text, 'nonZeroBits', { operation: 'decode' }),
  )
  it('rejects nonzero unused bits for Base32hex as well', () =>
    fails('CP======', 'nonZeroBits', { operation: 'decode', variant: 'hex' }))
  it.each(['\ud800', '\udfff', 'a\ud800b', '😀\udc00'])(
    'rejects lone surrogate %j',
    (text) => fails(text, 'invalidUnicode'),
  )
  it('rejects empty data but preserves text consisting entirely of whitespace', () => {
    fails('', 'empty')
    fails(' \n\t', 'empty', { operation: 'decode' })
    fails(' \n\t', 'empty', { representation: 'hex' })
    expect(convert(' ').output).toBe('EA======')
  })
  it('enforces input size before stripping whitespace or encoding', () => {
    const largest = '中'.repeat(MAX_BASE32_INPUT)
    const result = convert(largest)
    expect(result.bytes).toBe(300_000)
    expect(result.output.length).toBe(480_000)
    fails(largest + '中', 'inputLimit')
    expect(
      convert('A'.repeat(MAX_BASE32_INPUT), {
        operation: 'decode',
        representation: 'hex',
      }).bytes,
    ).toBe(62_500)
    fails(' '.repeat(MAX_BASE32_INPUT + 1), 'inputLimit', {
      operation: 'decode',
    })
    expect(
      convert('00'.repeat(MAX_BASE32_INPUT / 2), { representation: 'hex' })
        .bytes,
    ).toBe(50_000)
  })
})

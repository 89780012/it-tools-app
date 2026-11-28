import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  CODE_POINT_PREVIEW_LIMIT,
  MAX_UNICODE_INPUT,
  MAX_UNICODE_OUTPUT,
  NORMALIZATION_FORMS,
  normalizeUnicode,
  UnicodeNormalizationError,
  type NormalizationForm,
} from '../unicode-normalizer'

function error(
  input: string,
  code: string,
  position = 0,
  form: NormalizationForm = 'NFC',
) {
  expect(() => normalizeUnicode(input, form)).toThrow(
    expect.objectContaining({
      name: 'UnicodeNormalizationError',
      code,
      position,
    }),
  )
}

describe('Unicode normalization', () => {
  // Known UAX #15 cases: canonical ordering, composition exclusions and Hangul.
  it.each([
    ['Cafe\u0301', 'NFC', 'Café'],
    ['Café', 'NFD', 'Cafe\u0301'],
    ['A\u030a', 'NFC', 'Å'],
    ['\u212b', 'NFC', 'Å'],
    ['\u212b', 'NFD', 'A\u030a'],
    ['\u1e0a\u0323', 'NFD', 'D\u0323\u0307'],
    ['\u1e0a\u0323', 'NFC', '\u1e0c\u0307'],
    ['\u0344', 'NFC', '\u0308\u0301'],
    ['\u1100\u1161\u11a8', 'NFC', '각'],
    ['각', 'NFD', '\u1100\u1161\u11a8'],
    ['Ａ ﬃ ① ² \u00a0', 'NFKC', 'A ffi 1 2  '],
    ['Ａ ﬃ é', 'NFKD', 'A ffi e\u0301'],
    ['Ａ ﬃ ① ² \u00a0', 'NFC', 'Ａ ﬃ ① ² \u00a0'],
    ['Ａ ﬃ ① ² \u00a0', 'NFD', 'Ａ ﬃ ① ² \u00a0'],
    ['\uff76\uff9e', 'NFKC', 'ガ'],
    ['\uff76\uff9e', 'NFKD', 'カ\u3099'],
  ] as const)('normalizes %j with %s', (input, form, expected) => {
    const result = normalizeUnicode(input, form)
    expect(result.output).toBe(expected)
    expect(result.changed).toBe(input !== expected)
  })

  it.each(NORMALIZATION_FORMS)(
    'preserves whitespace, emoji and noncharacters in %s',
    (form) => {
      const text = ' \t\r\n👩‍💻 🏳️‍🌈 \u200b\u0000\uffff\u{10ffff} '
      const result = normalizeUnicode(text, form)
      expect(result.output).toBe(text)
      expect(result.changed).toBe(false)
      expect(normalizeUnicode(' \n\t', form).output).toBe(' \n\t')
    },
  )

  it('counts scalar values, UTF-16 units and UTF-8 bytes rather than graphemes', () => {
    const result = normalizeUnicode('e\u0301👩‍💻')
    expect(result.before).toEqual({
      codePoints: 5,
      codeUnits: 7,
      utf8Bytes: 14,
      preview: 'U+0065 U+0301 U+1F469 U+200D U+1F4BB',
      truncated: false,
    })
    expect(result.after).toEqual({
      codePoints: 4,
      codeUnits: 6,
      utf8Bytes: 13,
      preview: 'U+00E9 U+1F469 U+200D U+1F4BB',
      truncated: false,
    })
    // UTF-8 boundary values, including both ends of the surrogate gap.
    const text = '\u007f\u0080\u07ff\u0800\ud7ff\ue000\uffff\u{10000}\u{10ffff}'
    expect(normalizeUnicode(text).before.utf8Bytes).toBe(
      new TextEncoder().encode(text).length,
    )
  })

  it('caps previews by code points without truncating output or splitting astral characters', () => {
    const text = '😀'.repeat(CODE_POINT_PREVIEW_LIMIT + 1)
    const result = normalizeUnicode(text)
    expect(result.output).toBe(text)
    expect(result.after.preview.split(' ')).toHaveLength(
      CODE_POINT_PREVIEW_LIMIT,
    )
    expect(
      result.after.preview.split(' ').every((point) => point === 'U+1F600'),
    ).toBe(true)
    expect(result.after.truncated).toBe(true)
    expect(
      normalizeUnicode('😀'.repeat(CODE_POINT_PREVIEW_LIMIT)).after.truncated,
    ).toBe(false)
  })

  it('rejects empty input and invalid normalization forms', () => {
    error('', 'empty')
    error('abc', 'invalidForm', 0, 'nfc' as NormalizationForm)
    expect(new UnicodeNormalizationError('empty')).toBeInstanceOf(Error)
  })

  it.each([
    ['\ud800', 1],
    ['\udfff', 1],
    ['x\ud800y', 2],
    ['😀\udc00', 3],
    ['\ud800\ud800\udc00', 1],
    ['\ud800\udc00\ud800', 3],
  ] as const)(
    'rejects an unpaired surrogate in %j at unit %i',
    (input, position) => {
      error(input, 'invalidUnicode', position)
    },
  )

  it('accepts exact input limits in UTF-16 units and rejects overflow before processing', () => {
    expect(normalizeUnicode('a'.repeat(MAX_UNICODE_INPUT)).output).toHaveLength(
      MAX_UNICODE_INPUT,
    )
    expect(
      normalizeUnicode('😀'.repeat(MAX_UNICODE_INPUT / 2)).before.codePoints,
    ).toBe(MAX_UNICODE_INPUT / 2)
    error('a'.repeat(MAX_UNICODE_INPUT + 1), 'inputLimit')
    error('😀'.repeat(MAX_UNICODE_INPUT / 2) + '\ud800', 'inputLimit')
  })

  it('guards compatibility expansion at the output boundary', () => {
    // U+FDFA expands into 18 code units under compatibility normalization.
    const repeats = Math.floor(MAX_UNICODE_OUTPUT / 18)
    const exact = '\ufdfa'.repeat(repeats) + 'a'.repeat(MAX_UNICODE_OUTPUT % 18)
    expect(exact.length).toBeLessThan(MAX_UNICODE_INPUT)
    expect(normalizeUnicode(exact, 'NFKD').output).toHaveLength(
      MAX_UNICODE_OUTPUT,
    )
    error(exact + 'a', 'outputLimit', 0, 'NFKD')
  })

  it('is idempotent, preserves canonical equivalence, and reports actual UTF-8 sizes', () => {
    const scalar = fc
      .integer({ min: 0, max: 0x10ffff })
      .filter((point) => point < 0xd800 || point > 0xdfff)
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            scalar,
            fc.constantFrom(0x301, 0x323, 0xfb03, 0xac00, 0xff21),
          ),
          { minLength: 1, maxLength: 40 },
        ),
        (points) => {
          const input = String.fromCodePoint(...points)
          for (const form of NORMALIZATION_FORMS) {
            const result = normalizeUnicode(input, form)
            expect(normalizeUnicode(result.output, form).changed).toBe(false)
            expect(result.after.utf8Bytes).toBe(
              new TextEncoder().encode(result.output).length,
            )
            expect(result.after.codePoints).toBe(
              Array.from(result.output).length,
            )
          }
          expect(
            normalizeUnicode(normalizeUnicode(input, 'NFD').output, 'NFC')
              .output,
          ).toBe(normalizeUnicode(input, 'NFC').output)
        },
      ),
      { seed: 20261128, numRuns: 150 },
    )
  })
})

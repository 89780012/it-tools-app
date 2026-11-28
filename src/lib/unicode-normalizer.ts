export const NORMALIZATION_FORMS = ['NFC', 'NFD', 'NFKC', 'NFKD'] as const
export type NormalizationForm = (typeof NORMALIZATION_FORMS)[number]
export const MAX_UNICODE_INPUT = 100_000
export const MAX_UNICODE_OUTPUT = 1_000_000
export const CODE_POINT_PREVIEW_LIMIT = 64

export class UnicodeNormalizationError extends Error {
  constructor(
    public code:
      'empty' | 'inputLimit' | 'outputLimit' | 'invalidUnicode' | 'invalidForm',
    public position = 0,
  ) {
    super(code)
    this.name = 'UnicodeNormalizationError'
  }
}

function inspect(text: string) {
  let codePoints = 0
  let utf8Bytes = 0
  const preview: string[] = []
  for (const character of text) {
    const point = character.codePointAt(0)!
    codePoints++
    utf8Bytes +=
      point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4
    if (preview.length < CODE_POINT_PREVIEW_LIMIT)
      preview.push(`U+${point.toString(16).toUpperCase().padStart(4, '0')}`)
  }
  return {
    codeUnits: text.length,
    codePoints,
    utf8Bytes,
    preview: preview.join(' '),
    truncated: codePoints > CODE_POINT_PREVIEW_LIMIT,
  }
}

export function normalizeUnicode(
  input: string,
  form: NormalizationForm = 'NFC',
) {
  if (!NORMALIZATION_FORMS.includes(form))
    throw new UnicodeNormalizationError('invalidForm')
  if (!input.length) throw new UnicodeNormalizationError('empty')
  if (input.length > MAX_UNICODE_INPUT)
    throw new UnicodeNormalizationError('inputLimit')
  // Reject unpaired UTF-16 surrogates instead of silently replacing them on export.
  for (let index = 0; index < input.length; index++) {
    const unit = input.charCodeAt(index)
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = input.charCodeAt(index + 1)
      if (!(next >= 0xdc00 && next <= 0xdfff))
        throw new UnicodeNormalizationError('invalidUnicode', index + 1)
      index++
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new UnicodeNormalizationError('invalidUnicode', index + 1)
    }
  }
  // The browser's Unicode normalization implements UAX #15, including Hangul
  // composition, combining-class ordering and composition exclusions.
  const output = input.normalize(form)
  if (output.length > MAX_UNICODE_OUTPUT)
    throw new UnicodeNormalizationError('outputLimit')
  return {
    output,
    changed: input !== output,
    before: inspect(input),
    after: inspect(output),
  }
}

export type UnicodeNormalizationResult = ReturnType<typeof normalizeUnicode>

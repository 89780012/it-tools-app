/** RFC 4648 Base32 and Base32hex; no Node or network APIs. */
export const MAX_BASE32_INPUT = 100_000
export type Base32Variant = 'standard' | 'hex'
export type Base32Representation = 'text' | 'hex'
export type Base32Operation = 'encode' | 'decode'
export type Base32ErrorCode =
  | 'empty'
  | 'inputLimit'
  | 'invalidHex'
  | 'invalidUnicode'
  | 'invalidCharacters'
  | 'invalidPadding'
  | 'invalidLength'
  | 'nonZeroBits'
  | 'invalidUtf8'
export class Base32Error extends Error {
  constructor(public code: Base32ErrorCode) {
    super(code)
    this.name = 'Base32Error'
  }
}
const alphabets = {
  standard: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
  hex: '0123456789ABCDEFGHIJKLMNOPQRSTUV',
}
const asciiWhitespace = /[\t\n\v\f\r ]/g

export function encodeBase32(
  bytes: Uint8Array,
  variant: Base32Variant,
  padding: boolean,
): string {
  const alphabet = alphabets[variant]
  let buffer = 0
  let bits = 0
  let output = ''
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      output += alphabet[(buffer >>> bits) & 31]
    }
    buffer &= (1 << bits) - 1
  }
  if (bits) output += alphabet[(buffer << (5 - bits)) & 31]
  if (padding) output = output.padEnd(Math.ceil(output.length / 8) * 8, '=')
  return output
}

export function decodeBase32(
  input: string,
  variant: Base32Variant,
): Uint8Array {
  const compact = input.replace(asciiWhitespace, '')
  const firstPad = compact.indexOf('=')
  const data = firstPad < 0 ? compact : compact.slice(0, firstPad)
  const suffix = firstPad < 0 ? '' : compact.slice(firstPad)
  if (suffix && !/^=+$/.test(suffix)) throw new Base32Error('invalidPadding')
  const allowed = variant === 'standard' ? /^[A-Za-z2-7]*$/ : /^[0-9A-Va-v]*$/
  if (!allowed.test(data)) throw new Base32Error('invalidCharacters')
  const padCounts: Record<number, number> = { 0: 0, 2: 6, 4: 4, 5: 3, 7: 1 }
  const expectedPad = padCounts[data.length % 8]
  if (expectedPad === undefined) throw new Base32Error('invalidLength')
  if (suffix && (suffix.length !== expectedPad || compact.length % 8 !== 0)) {
    throw new Base32Error('invalidPadding')
  }
  const alphabet = alphabets[variant]
  const output = new Uint8Array(Math.floor((data.length * 5) / 8))
  let buffer = 0
  let bits = 0
  let offset = 0
  for (const char of data.toUpperCase()) {
    buffer = (buffer << 5) | alphabet.indexOf(char)
    bits += 5
    if (bits >= 8) {
      bits -= 8
      output[offset++] = (buffer >>> bits) & 255
    }
    buffer &= (1 << bits) - 1
  }
  // Reject alternate spellings that hide extra non-zero bits after the last byte.
  if (buffer !== 0) throw new Base32Error('nonZeroBits')
  return output
}

export interface Base32Options {
  operation: Base32Operation
  representation: Base32Representation
  variant: Base32Variant
  padding: boolean
}
export interface Base32Result {
  output: string
  bytes: number
}
export function convertBase32(
  input: string,
  options: Base32Options,
): Base32Result {
  if (input.length > MAX_BASE32_INPUT) throw new Base32Error('inputLimit')
  if (input.length === 0) throw new Base32Error('empty')
  let bytes: Uint8Array
  if (options.operation === 'encode') {
    if (options.representation === 'hex') {
      const hex = input.replace(asciiWhitespace, '')
      if (!hex) throw new Base32Error('empty')
      if (!/^(?:[0-9a-fA-F]{2})+$/.test(hex))
        throw new Base32Error('invalidHex')
      bytes = Uint8Array.from(hex.match(/../g)!, (byte) => parseInt(byte, 16))
    } else {
      // TextEncoder replaces lone surrogates silently; fail instead of losing data.
      for (const char of input) {
        const point = char.codePointAt(0)!
        if (point >= 0xd800 && point <= 0xdfff)
          throw new Base32Error('invalidUnicode')
      }
      bytes = new TextEncoder().encode(input)
    }
    return {
      output: encodeBase32(bytes, options.variant, options.padding),
      bytes: bytes.length,
    }
  }
  if (!input.replace(asciiWhitespace, '')) throw new Base32Error('empty')
  bytes = decodeBase32(input, options.variant)
  let output: string
  if (options.representation === 'hex') {
    output = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')
  } else {
    try {
      // Preserve an initial UTF-8 BOM as U+FEFF so encoding again is lossless.
      output = new TextDecoder('utf-8', {
        fatal: true,
        ignoreBOM: true,
      }).decode(bytes)
    } catch {
      throw new Base32Error('invalidUtf8')
    }
  }
  return { output, bytes: bytes.length }
}

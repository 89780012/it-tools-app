import { decodeHTML, escapeText } from 'entities'

export type TextEscapeMode = 'json' | 'unicode' | 'html' | 'nested'
export class TextEscapeError extends Error {}

export function transformTextEscape(
  input: string,
  mode: TextEscapeMode,
  decode: boolean,
  maxDepth = 5,
): string {
  if (mode === 'html')
    return decode
      ? decodeHTML(input)
      : escapeText(input).replaceAll('"', '&quot;').replaceAll("'", '&#39;')
  if (mode === 'unicode') {
    if (!decode) {
      // Escape every UTF-16 unit, including both units of supplementary characters.
      let output = ''
      for (let i = 0; i < input.length; i++)
        output += `\\u${input.charCodeAt(i).toString(16).padStart(4, '0')}`
      return output
    }
    if (/\\u(?![\da-fA-F]{4})/u.test(input))
      throw new TextEscapeError('invalidUnicode')
    return input.replace(/\\u([\da-fA-F]{4})/g, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
  }
  if (mode === 'nested') {
    if (!Number.isInteger(maxDepth) || maxDepth < 1 || maxDepth > 20)
      throw new TextEscapeError('depthError')
    let result: unknown = input
    for (let depth = 0; depth < maxDepth; depth++) {
      if (typeof result !== 'string') return JSON.stringify(result, null, 2)
      try {
        result = JSON.parse(result)
      } catch {
        if (depth === 0) throw new TextEscapeError('invalidJson')
        // Ordinary decoded text is the final result, with whitespace intact.
        return result as string
      }
    }
    if (typeof result !== 'string') return JSON.stringify(result, null, 2)
    try {
      JSON.parse(result)
    } catch {
      return result
    }
    throw new TextEscapeError('depthError')
  }
  if (!decode) return JSON.stringify(input)
  let value: unknown
  try {
    value = JSON.parse(input)
  } catch {
    throw new TextEscapeError('invalidJson')
  }
  if (typeof value !== 'string') throw new TextEscapeError('stringRequired')
  return value
}

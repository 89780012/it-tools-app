import { parse, stringify } from 'lossless-json'

export const JSON_LINES_MAX_BYTES = 5 * 1024 * 1024
export const JSON_LINES_MAX_RECORDS = 50_000
export const JSON_LINES_MAX_DEPTH = 100
export type JsonLinesDirection = 'toLines' | 'toJson'
export type JsonLinesErrorCode =
  | 'empty'
  | 'tooLarge'
  | 'tooManyRecords'
  | 'tooDeep'
  | 'invalidJson'
  | 'expectedArray'
  | 'blankLine'
  | 'invalidLine'

export class JsonLinesError extends Error {
  constructor(
    public code: JsonLinesErrorCode,
    public line = 1,
  ) {
    super(code)
    this.name = 'JsonLinesError'
  }
}

export interface JsonLinesResult {
  output: string
  records: number
  skipped: number
}

// Bound recursive parsing/serialization without counting brackets inside strings.
function checkDepth(source: string) {
  let depth = 0
  let quoted = false
  let escaped = false
  for (const character of source) {
    if (quoted) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') quoted = false
    } else if (character === '"') quoted = true
    else if (character === '[' || character === '{') {
      if (++depth > JSON_LINES_MAX_DEPTH) throw new JsonLinesError('tooDeep')
    } else if (character === ']' || character === '}') depth--
  }
}

function parseRecord(
  source: string,
  code: 'invalidJson' | 'invalidLine',
  line = 1,
) {
  checkDepth(source)
  try {
    return parse(source)
  } catch {
    // Keep parser internals and user data out of localized error messages.
    throw new JsonLinesError(code, line)
  }
}

export function convertJsonLines(
  input: string,
  direction: JsonLinesDirection,
  skipBlankLines = true,
): JsonLinesResult {
  if (
    input.length > JSON_LINES_MAX_BYTES ||
    new TextEncoder().encode(input).length > JSON_LINES_MAX_BYTES
  )
    throw new JsonLinesError('tooLarge')
  // Accept a single UTF-8 BOM from exported files; other JSON whitespace stays strict.
  const source = input.replace(/^\uFEFF/, '')
  if (/^[\x20\t\r\n]*$/.test(source)) throw new JsonLinesError('empty')

  if (direction === 'toLines') {
    const value = parseRecord(source, 'invalidJson')
    if (!Array.isArray(value)) throw new JsonLinesError('expectedArray')
    if (value.length > JSON_LINES_MAX_RECORDS)
      throw new JsonLinesError('tooManyRecords')
    return {
      output:
        value.map((record) => stringify(record)!).join('\n') +
        (value.length ? '\n' : ''),
      records: value.length,
      skipped: 0,
    }
  }

  const lines = source.split(/\r\n|\n/)
  // A final line terminator is not an extra empty record.
  if (lines.at(-1) === '') lines.pop()
  const records: string[] = []
  let skipped = 0
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    if (/^[\x20\t\r]*$/.test(line)) {
      if (!skipBlankLines) throw new JsonLinesError('blankLine', index + 1)
      skipped++
      continue
    }
    if (records.length >= JSON_LINES_MAX_RECORDS)
      throw new JsonLinesError('tooManyRecords')
    records.push(stringify(parseRecord(line, 'invalidLine', index + 1))!)
  }
  return {
    // Keep each record compact to bound output size even for deeply nested input.
    output: `[\n  ${records.join(',\n  ')}\n]`,
    records: records.length,
    skipped,
  }
}

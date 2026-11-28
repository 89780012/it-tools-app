import { isLosslessNumber, parse, stringify } from 'lossless-json'

export const POINTER_MAX_INPUT = 500_000
export const POINTER_MAX_LENGTH = 4_096
export const POINTER_MAX_DEPTH = 64
export const POINTER_MAX_OUTPUT = 5_000_000

export class JsonPointerError extends Error {
  constructor(
    public code:
      | 'emptyJson'
      | 'invalidJson'
      | 'duplicateKey'
      | 'inputLimit'
      | 'depthLimit'
      | 'pointerLimit'
      | 'invalidFragment'
      | 'invalidPointer'
      | 'invalidEscape'
      | 'missingKey'
      | 'invalidIndex'
      | 'indexRange'
      | 'scalarTraversal'
      | 'outputLimit',
    public field: 'json' | 'pointer',
    public step = 0,
  ) {
    super(code)
    this.name = 'JsonPointerError'
  }
}

// lossless-json only reports duplicate keys whose values differ. RFC 6901
// references must be unambiguous, so also reject equal-value duplicates.
// Run this token scan only after the full JSON syntax has been validated.
function assertUniqueKeys(source: string) {
  const scopes: (Set<string> | null)[] = []
  for (const match of source.matchAll(/"(?:[^"\\]|\\.)*"|[{}\[\]]/g)) {
    const token = match[0]
    if (token === '{') scopes.push(new Set())
    else if (token === '[') scopes.push(null)
    else if (token === '}' || token === ']') scopes.pop()
    else {
      let next = match.index + token.length
      while (/[\x20\t\r\n]/.test(source[next] ?? '') && next < source.length)
        next++
      if (source[next] !== ':') continue
      const keys = scopes.at(-1)!
      const key = JSON.parse(token) as string
      if (keys!.has(key)) throw new JsonPointerError('duplicateKey', 'json')
      keys!.add(key)
    }
  }
}

function readJson(source: string): unknown {
  if (source.length > POINTER_MAX_INPUT)
    throw new JsonPointerError('inputLimit', 'json')
  if (/^[\x20\t\r\n]*$/.test(source))
    throw new JsonPointerError('emptyJson', 'json')
  let depth = 0
  let quoted = false
  let escaped = false
  // Bound the recursive parser before invoking it; string contents are data.
  for (const character of source) {
    if (quoted) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') quoted = false
    } else if (character === '"') quoted = true
    else if (character === '[' || character === '{') {
      if (++depth > POINTER_MAX_DEPTH)
        throw new JsonPointerError('depthLimit', 'json')
    } else if (character === ']' || character === '}') depth--
  }
  try {
    const value = parse(source, null, {
      onDuplicateKey: () => {
        throw new JsonPointerError('duplicateKey', 'json')
      },
    })
    assertUniqueKeys(source)
    return value
  } catch (error) {
    if (error instanceof JsonPointerError) throw error
    throw new JsonPointerError('invalidJson', 'json')
  }
}

export interface JsonPointerResult {
  output: string
  pointer: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
}

/** RFC 6901: a pointer selects exactly one value, including scalar roots. */
export function resolveJsonPointer(
  source: string,
  input: string,
): JsonPointerResult {
  let value = readJson(source)
  if (input.length > POINTER_MAX_LENGTH)
    throw new JsonPointerError('pointerLimit', 'pointer')
  let pointer = input
  if (pointer.startsWith('#')) {
    try {
      pointer = decodeURIComponent(pointer.slice(1))
    } catch {
      throw new JsonPointerError('invalidFragment', 'pointer')
    }
  }
  if (pointer !== '' && !pointer.startsWith('/'))
    throw new JsonPointerError('invalidPointer', 'pointer')
  const tokens = pointer === '' ? [] : pointer.slice(1).split('/')
  // Validate all escapes before traversal. A single replacement avoids decoding
  // ~01 twice: it denotes the literal key ~1, not a slash.
  const decoded = tokens.map((token, index) => {
    if (/~(?:[^01]|$)/.test(token))
      throw new JsonPointerError('invalidEscape', 'pointer', index + 1)
    return token.replace(/~[01]/g, (escape) => (escape === '~1' ? '/' : '~'))
  })
  for (const [index, token] of decoded.entries()) {
    const step = index + 1
    if (Array.isArray(value)) {
      if (!/^(0|[1-9][0-9]*)$/.test(token))
        throw new JsonPointerError('invalidIndex', 'pointer', step)
      const position = Number(token)
      if (!Number.isSafeInteger(position) || position >= value.length)
        throw new JsonPointerError('indexRange', 'pointer', step)
      value = value[position]
    } else if (
      value !== null &&
      typeof value === 'object' &&
      !isLosslessNumber(value)
    ) {
      if (!Object.hasOwn(value, token))
        throw new JsonPointerError('missingKey', 'pointer', step)
      value = (value as Record<string, unknown>)[token]
    } else {
      throw new JsonPointerError('scalarTraversal', 'pointer', step)
    }
  }
  const type =
    value === null
      ? 'null'
      : isLosslessNumber(value)
        ? 'number'
        : Array.isArray(value)
          ? 'array'
          : (typeof value as 'object' | 'string' | 'boolean')
  const output = stringify(value, null, 2)!
  if (output.length > POINTER_MAX_OUTPUT)
    throw new JsonPointerError('outputLimit', 'json')
  return { output, pointer, type }
}

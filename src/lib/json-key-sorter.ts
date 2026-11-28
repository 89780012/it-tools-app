import { isLosslessNumber, parse } from 'lossless-json'

export const SORT_MAX_INPUT = 500_000
export const SORT_MAX_DEPTH = 64
export const SORT_MAX_OUTPUT = 5_000_000
export type SortOptions = {
  order: 'asc' | 'desc'
  indent: '2' | '4' | 'compact'
}
export class JsonKeySortError extends Error {
  constructor(
    public code:
      | 'empty'
      | 'invalidJson'
      | 'duplicateKey'
      | 'inputLimit'
      | 'depthLimit'
      | 'outputLimit',
  ) {
    super(code)
    this.name = 'JsonKeySortError'
  }
}

function read(source: string): unknown {
  if (source.length > SORT_MAX_INPUT) throw new JsonKeySortError('inputLimit')
  if (/^[\x20\t\r\n]*$/.test(source)) throw new JsonKeySortError('empty')
  let depth = 0
  let quoted = false
  let escaped = false
  for (const char of source) {
    if (quoted) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') quoted = false
    } else if (char === '"') quoted = true
    else if (char === '[' || char === '{') {
      if (++depth > SORT_MAX_DEPTH) throw new JsonKeySortError('depthLimit')
    } else if (char === ']' || char === '}') depth--
  }
  try {
    const value = parse(source, null, {
      onDuplicateKey: () => {
        throw new JsonKeySortError('duplicateKey')
      },
    })
    // Also reject equal-value duplicates, which lossless-json accepts.
    const scopes: (Set<string> | null)[] = []
    for (const match of source.matchAll(/"(?:[^"\\]|\\.)*"|[{}\[\]]/g)) {
      const token = match[0]
      if (token === '{') scopes.push(new Set())
      else if (token === '[') scopes.push(null)
      else if (token === '}' || token === ']') scopes.pop()
      else {
        let next = match.index + token.length
        while (next < source.length && /[\x20\t\r\n]/.test(source[next])) next++
        if (source[next] !== ':') continue
        const key = JSON.parse(token) as string
        const keys = scopes.at(-1)!
        if (keys.has(key)) throw new JsonKeySortError('duplicateKey')
        keys.add(key)
      }
    }
    return value
  } catch (caught) {
    if (caught instanceof JsonKeySortError) throw caught
    throw new JsonKeySortError('invalidJson')
  }
}

/** Emit members directly: assigning sorted keys to an object would reorder
 * integer-like keys again under JavaScript's property enumeration rules. */
export function sortJsonKeys(source: string, options: SortOptions) {
  const value = read(source)
  const unit =
    options.indent === 'compact' ? '' : ' '.repeat(Number(options.indent))
  const parts: string[] = []
  let length = 0
  let objects = 0
  let keys = 0
  function write(text: string) {
    length += text.length
    if (length > SORT_MAX_OUTPUT) throw new JsonKeySortError('outputLimit')
    parts.push(text)
  }
  function emit(current: unknown, depth: number) {
    if (isLosslessNumber(current)) {
      write(current.value)
      return
    }
    if (current === null || typeof current !== 'object') {
      write(JSON.stringify(current))
      return
    }
    const array = Array.isArray(current)
    const members = array ? [] : Object.keys(current).sort()
    if (!array && options.order === 'desc') members.reverse()
    if (!array) {
      objects++
      keys += members.length
    }
    const count = array ? current.length : members.length
    write(array ? '[' : '{')
    for (let index = 0; index < count; index++) {
      if (index) write(',')
      if (unit) write('\n' + unit.repeat(depth + 1))
      if (array) emit(current[index], depth + 1)
      else {
        const key = members[index]
        write(JSON.stringify(key) + (unit ? ': ' : ':'))
        emit((current as Record<string, unknown>)[key], depth + 1)
      }
    }
    if (count && unit) write('\n' + unit.repeat(depth))
    write(array ? ']' : '}')
  }
  emit(value, 0)
  return { output: parts.join(''), objects, keys }
}

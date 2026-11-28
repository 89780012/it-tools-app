import { isLosslessNumber, parse, stringify } from 'lossless-json'

export const MERGE_PATCH_MAX_INPUT = 500_000
export const MERGE_PATCH_MAX_DEPTH = 64
export const MERGE_PATCH_MAX_OUTPUT = 5_000_000
export type MergePatchField = 'target' | 'patch' | 'output'
export class MergePatchError extends Error {
  constructor(
    public code: 'empty' | 'invalid' | 'tooLarge' | 'tooDeep' | 'outputLimit',
    public field: MergePatchField,
  ) {
    super(code)
    this.name = 'MergePatchError'
  }
}

function read(source: string, field: MergePatchField): unknown {
  if (source.length > MERGE_PATCH_MAX_INPUT)
    throw new MergePatchError('tooLarge', field)
  if (/^[\x20\t\r\n]*$/.test(source)) throw new MergePatchError('empty', field)
  // Bound recursive parsing and merging; brackets inside strings are data.
  let depth = 0
  let quoted = false
  let escaped = false
  for (const character of source) {
    if (quoted) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') quoted = false
    } else if (character === '"') quoted = true
    else if (character === '{' || character === '[') {
      if (++depth > MERGE_PATCH_MAX_DEPTH)
        throw new MergePatchError('tooDeep', field)
    } else if (character === '}' || character === ']') depth--
  }
  try {
    // Strict JSON; the parser rejects conflicting duplicates and retains numeric lexemes.
    return parse(source)
  } catch {
    throw new MergePatchError('invalid', field)
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !isLosslessNumber(value)
  )
}

// RFC 7396 section 2. Null-prototype dictionaries keep every JSON key as data,
// including __proto__, constructor and prototype, without inherited lookups.
function merge(target: unknown, patch: unknown): unknown {
  if (!isObject(patch)) return patch
  const result: Record<string, unknown> = Object.assign(
    Object.create(null),
    isObject(target) ? target : {},
  )
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete result[key]
    else result[key] = merge(result[key], value)
  }
  return result
}

export function applyJsonMergePatch(target: string, patch: string): string {
  const original = read(target, 'target')
  const changes = read(patch, 'patch')
  const output = stringify(merge(original, changes), null, 2)!
  if (output.length > MERGE_PATCH_MAX_OUTPUT)
    throw new MergePatchError('outputLimit', 'output')
  return output
}

import { isLosslessNumber, parse, stringify } from 'lossless-json'

export const JSON_PATCH_MAX_INPUT = 500_000
export const JSON_PATCH_MAX_DEPTH = 64
export const JSON_PATCH_MAX_OPERATIONS = 200
export const JSON_PATCH_MAX_OUTPUT = 2_000_000
const MAX_WORK = 20_000_000
const MAX_POINTER = 4096

type Field = 'target' | 'patch'
type ErrorCode =
  | 'empty'
  | 'invalidJson'
  | 'duplicateKey'
  | 'inputLimit'
  | 'depthLimit'
  | 'invalidPatch'
  | 'operationLimit'
  | 'invalidOperation'
  | 'invalidPointer'
  | 'missingPath'
  | 'invalidIndex'
  | 'moveChild'
  | 'testFailed'
  | 'noDocument'
  | 'outputLimit'
  | 'workLimit'

export class JsonPatchError extends Error {
  constructor(
    public code: ErrorCode,
    public field: Field,
    public operation = 0,
  ) {
    super(code)
    this.name = 'JsonPatchError'
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !isLosslessNumber(value)
  )
}

function read(source: string, field: Field): unknown {
  if (source.length > JSON_PATCH_MAX_INPUT)
    throw new JsonPatchError('inputLimit', field)
  if (/^[\x20\t\r\n]*$/.test(source)) throw new JsonPatchError('empty', field)
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
      if (++depth > JSON_PATCH_MAX_DEPTH)
        throw new JsonPatchError('depthLimit', field)
    } else if (char === ']' || char === '}') depth--
  }
  try {
    const result = parse(source, null, {
      onDuplicateKey: () => {
        throw new JsonPatchError('duplicateKey', field)
      },
    })
    // The parser does not report equal-value duplicates. Reject those too so
    // operation members and paths always have an unambiguous meaning.
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
        if (scopes.at(-1)!.has(key))
          throw new JsonPatchError('duplicateKey', field)
        scopes.at(-1)!.add(key)
      }
    }
    return clone(result)
  } catch (caught) {
    if (caught instanceof JsonPatchError) throw caught
    throw new JsonPatchError('invalidJson', field)
  }
}

// Null-prototype dictionaries and own-property traversal make keys such as
// __proto__ ordinary data. Copies never share mutable containers.
function clone(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clone)
  if (!object(value)) return value
  const result = Object.create(null) as Record<string, unknown>
  for (const [key, child] of Object.entries(value)) result[key] = clone(child)
  return result
}

function pointer(value: unknown): string[] {
  if (
    typeof value !== 'string' ||
    value.length > MAX_POINTER ||
    (value !== '' && !value.startsWith('/')) ||
    /~(?:[^01]|$)/.test(value)
  )
    throw new JsonPatchError('invalidPointer', 'patch')
  return value === ''
    ? []
    : value
        .slice(1)
        .split('/')
        .map((token) =>
          token.replace(/~[01]/g, (escape) => (escape === '~1' ? '/' : '~')),
        )
}

function index(token: string, length: number, adding = false): number {
  if (adding && token === '-') return length
  if (!/^(0|[1-9][0-9]*)$/.test(token))
    throw new JsonPatchError('invalidIndex', 'patch')
  const value = Number(token)
  if (!Number.isSafeInteger(value) || value >= length + (adding ? 1 : 0))
    throw new JsonPatchError('invalidIndex', 'patch')
  return value
}

function get(document: unknown, path: string[]): unknown {
  let value = document
  for (const token of path) {
    if (Array.isArray(value)) value = value[index(token, value.length)]
    else if (object(value) && Object.hasOwn(value, token)) value = value[token]
    else throw new JsonPatchError('missingPath', 'patch')
  }
  if (value === undefined) throw new JsonPatchError('missingPath', 'patch')
  return value
}

function change(
  document: unknown,
  path: string[],
  op: 'add' | 'remove' | 'replace',
  value?: unknown,
): unknown {
  if (!path.length) {
    if (op !== 'add') get(document, [])
    return op === 'remove' ? undefined : value
  }
  const parent = get(document, path.slice(0, -1))
  const key = path.at(-1)!
  if (Array.isArray(parent)) {
    const at = index(key, parent.length, op === 'add')
    if (op === 'add') parent.splice(at, 0, value)
    else if (op === 'remove') parent.splice(at, 1)
    else parent[at] = value
  } else if (object(parent)) {
    if (op !== 'add' && !Object.hasOwn(parent, key))
      throw new JsonPatchError('missingPath', 'patch')
    if (op === 'remove') delete parent[key]
    else parent[key] = value
  } else throw new JsonPatchError('missingPath', 'patch')
  return document
}

// Compare exact decimal values without converting mantissas or exponents to
// Number. BigInt handles even exponents beyond the IEEE-754 integer range;
// no potentially enormous decimal expansion is allocated.
function numericKey(value: string): string {
  const [mantissa, exponent = '0'] = value.toLowerCase().split('e')
  const fraction = mantissa.includes('.')
    ? mantissa.length - mantissa.indexOf('.') - 1
    : 0
  const raw = mantissa.replace(/[-.]/g, '').replace(/^0+/, '')
  const digits = raw.replace(/0+$/, '')
  if (!digits) return '0'
  const scale =
    BigInt(exponent) - BigInt(fraction) + BigInt(raw.length - digits.length)
  return `${mantissa.startsWith('-') ? '-' : ''}${digits}e${scale}`
}

function equal(a: unknown, b: unknown): boolean {
  if (isLosslessNumber(a) || isLosslessNumber(b))
    return (
      isLosslessNumber(a) &&
      isLosslessNumber(b) &&
      numericKey(a.value) === numericKey(b.value)
    )
  if (a === b) return true
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, i) => equal(value, b[i]))
    )
  if (object(a) && object(b)) {
    const keys = Object.keys(a)
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]))
    )
  }
  return false
}

/** Apply RFC 6902 sequentially; no partial result is returned on failure. */
export function applyJsonPatch(target: string, patch: string): string {
  let document = read(target, 'target')
  const operations = read(patch, 'patch')
  if (!Array.isArray(operations))
    throw new JsonPatchError('invalidPatch', 'patch')
  if (operations.length > JSON_PATCH_MAX_OPERATIONS)
    throw new JsonPatchError('operationLimit', 'patch')
  let work = 0
  // Bound depth and pretty-print expansion BEFORE serialization, and cap total
  // traversal work across operations to stop repeated copy amplification.
  function budget(value: unknown, field: Field) {
    let size = 0
    function visit(child: unknown, depth: number) {
      const container = Array.isArray(child) || object(child)
      if (container && depth >= JSON_PATCH_MAX_DEPTH)
        throw new JsonPatchError('depthLimit', field)
      size += container ? 2 : (stringify(child)?.length ?? 0)
      if (size > JSON_PATCH_MAX_OUTPUT)
        throw new JsonPatchError('outputLimit', field)
      if (container) {
        const entries = Object.entries(child as object)
        for (const [key, item] of entries) {
          size +=
            2 * (depth + 1) +
            2 +
            (Array.isArray(child) ? 0 : JSON.stringify(key).length + 2)
          visit(item, depth + 1)
        }
        if (entries.length) size += 2 * depth
      }
    }
    visit(value, 0)
    if (size > JSON_PATCH_MAX_OUTPUT)
      throw new JsonPatchError('outputLimit', field)
    work += size
    if (work > MAX_WORK) throw new JsonPatchError('workLimit', field)
  }
  budget(document, 'target')
  for (const [i, operation] of operations.entries()) {
    try {
      if (
        !object(operation) ||
        typeof operation.op !== 'string' ||
        !['add', 'remove', 'replace', 'move', 'copy', 'test'].includes(
          operation.op,
        )
      )
        throw new JsonPatchError('invalidOperation', 'patch')
      const op = operation.op
      const path = pointer(operation.path)
      if (op === 'add' || op === 'replace' || op === 'test') {
        if (!Object.hasOwn(operation, 'value'))
          throw new JsonPatchError('invalidOperation', 'patch')
        if (op === 'test') {
          if (!equal(get(document, path), operation.value))
            throw new JsonPatchError('testFailed', 'patch')
        } else document = change(document, path, op, clone(operation.value))
      } else if (op === 'remove') document = change(document, path, op)
      else {
        const from = pointer(operation.from)
        const value = get(document, from)
        if (op === 'move') {
          if (
            path.length > from.length &&
            from.every((token, at) => path[at] === token)
          )
            throw new JsonPatchError('moveChild', 'patch')
          document = change(document, from, 'remove')
        }
        document = change(document, path, 'add', clone(value))
      }
      budget(document, 'patch')
    } catch (caught) {
      if (caught instanceof JsonPatchError) caught.operation = i + 1
      throw caught
    }
  }
  if (document === undefined)
    throw new JsonPatchError('noDocument', 'patch', operations.length)
  return stringify(document, null, 2)!
}

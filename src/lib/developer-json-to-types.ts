type Primitive = 'string' | 'number' | 'boolean' | 'null' | 'unknown'
interface Property {
  schema: Schema
  optional: boolean
}
type Schema =
  | { kind: Primitive }
  | { kind: 'array'; item: Schema }
  | { kind: 'object'; properties: Map<string, Property> }
  | { kind: 'union'; variants: Schema[] }
export type TypeLanguage = 'typescript' | 'go'

function infer(values: unknown[], depth = 0): Schema {
  if (depth > 80) throw new Error('tooDeep')
  if (!values.length) return { kind: 'unknown' }
  const grouped = new Map<string, unknown[]>()
  for (const value of values) {
    const kind =
      value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
    if (
      !['null', 'array', 'object', 'string', 'number', 'boolean'].includes(
        kind,
      ) ||
      (kind === 'number' && !Number.isFinite(value))
    )
      throw new Error('invalidJson')
    const group = grouped.get(kind) ?? []
    group.push(value)
    grouped.set(kind, group)
  }
  const variants: Schema[] = []
  for (const [kind, group] of grouped) {
    if (kind === 'array')
      variants.push({
        kind: 'array',
        item: infer((group as unknown[][]).flat(), depth + 1),
      })
    else if (kind === 'object') {
      const objects = group as Record<string, unknown>[]
      const keys = new Set(objects.flatMap((object) => Object.keys(object)))
      const properties = new Map<string, Property>()
      for (const key of keys) {
        const present = objects.filter((object) => Object.hasOwn(object, key))
        properties.set(key, {
          schema: infer(
            present.map((object) => object[key]),
            depth + 1,
          ),
          optional: present.length !== objects.length,
        })
      }
      variants.push({ kind: 'object', properties })
    } else variants.push({ kind: kind as Primitive })
  }
  return variants.length === 1 ? variants[0] : { kind: 'union', variants }
}

function identifier(hint: string) {
  const name =
    hint
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') || 'Value'
  return /^[A-Z]/.test(name) ? name : `Type${name}`
}
function uniqueName(base: string, used: Set<string>) {
  let name = base,
    index = 2
  while (used.has(name)) name = `${base}${index++}`
  used.add(name)
  return name
}
function goTag(key: string, optional: boolean) {
  // encoding/json cannot map these names with a struct tag. Reject rather than silently changing the JSON contract.
  if (
    !key ||
    key === '-' ||
    /[",\\\x00-\x1f\x7f]/.test(key) ||
    !/^[\p{L}\p{N} !#$%&()*+\-./:;<=>?@\[\]^_{|}~]+$/u.test(key)
  )
    throw new Error('goKey')
  const tag = `json:${JSON.stringify(key + (optional ? ',omitempty' : ''))}`
  return `\`${tag}\``
}

export function generateTypes(
  json: string,
  language: TypeLanguage = 'typescript',
  rootName = 'Root',
): string {
  if (json.length > 200_000) throw new Error('tooLarge')
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error('invalidJson')
  }
  const schema = infer([value])
  const used = new Set<string>([
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'Date',
    'Promise',
    'Record',
    'Map',
    'Set',
    'Error',
  ])
  const root = uniqueName(identifier(rootName), used)
  const names = new Map<Schema, string>()
  const declarations: string[] = []
  const render = (node: Schema, hint: string, forced?: string): string => {
    if (node.kind === 'union') {
      if (language === 'typescript')
        return node.variants.map((variant) => render(variant, hint)).join(' | ')
      const nonNull = node.variants.filter((variant) => variant.kind !== 'null')
      // Go has no union types. any is the lossless representation of mixed JSON values.
      if (nonNull.length !== 1) return 'any'
      const type = render(nonNull[0], hint)
      return type === 'any' || type.startsWith('[]') ? type : `*${type}`
    }
    if (node.kind === 'array') {
      const item = render(node.item, `${hint}Item`)
      return language === 'typescript' ? `(${item})[]` : `[]${item}`
    }
    if (node.kind !== 'object')
      return language === 'typescript'
        ? node.kind
        : (
            {
              string: 'string',
              number: 'float64',
              boolean: 'bool',
              null: 'any',
              unknown: 'any',
            } as const
          )[node.kind]
    const existing = names.get(node)
    if (existing) return existing
    const name = forced ?? uniqueName(identifier(hint), used)
    names.set(node, name)
    const slot = declarations.length
    declarations.push('')
    const fieldNames = new Set<string>()
    const fields = [...node.properties].map(([key, property]) => {
      let type = render(property.schema, `${name}${identifier(key)}`)
      if (language === 'typescript') {
        const propertyName = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
          ? key
          : JSON.stringify(key)
        return `  ${propertyName}${property.optional ? '?' : ''}: ${type};`
      }
      const field = uniqueName(identifier(key), fieldNames)
      if (
        property.optional &&
        type !== 'any' &&
        !type.startsWith('*') &&
        !type.startsWith('[]')
      )
        type = `*${type}`
      return `\t${field} ${type} ${goTag(key, property.optional)}`
    })
    declarations[slot] =
      language === 'typescript'
        ? `export interface ${name} {\n${fields.join('\n')}\n}`
        : `type ${name} struct {\n${fields.join('\n')}\n}`
    return name
  }
  if (schema.kind === 'object') render(schema, root, root)
  else {
    const type = render(schema, root)
    declarations.unshift(
      language === 'typescript'
        ? `export type ${root} = ${type};`
        : `type ${root} ${type}`,
    )
  }
  return (
    (language === 'go' ? 'package main\n\n' : '') +
    declarations.join('\n\n') +
    '\n'
  )
}

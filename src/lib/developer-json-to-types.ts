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
export type TypeLanguage =
  'typescript' | 'go' | 'java' | 'python' | 'csharp' | 'schema'

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
  if (language !== 'typescript' && language !== 'go')
    return generateAdditionalTypes(schema, language, rootName)
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

function generateAdditionalTypes(
  schema: Schema,
  language: 'java' | 'python' | 'csharp' | 'schema',
  rootName: string,
): string {
  if (language === 'schema') {
    const renderSchema = (node: Schema): unknown => {
      if (node.kind === 'union')
        return { anyOf: node.variants.map(renderSchema) }
      if (node.kind === 'unknown') return {}
      if (node.kind === 'array')
        return { type: 'array', items: renderSchema(node.item) }
      if (node.kind === 'object')
        return {
          type: 'object',
          properties: Object.fromEntries(
            [...node.properties].map(([key, value]) => [
              key,
              renderSchema(value.schema),
            ]),
          ),
          required: [...node.properties]
            .filter(([, value]) => !value.optional)
            .map(([key]) => key),
        }
      return { type: node.kind }
    }
    return JSON.stringify(
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: rootName,
        ...(renderSchema(schema) as object),
      },
      null,
      2,
    )
  }
  const reserved = [
    'String',
    'Double',
    'Boolean',
    'Object',
    'List',
    'Dictionary',
    'Any',
    'TypedDict',
    'NotRequired',
    'JsonPropertyName',
    'JsonProperty',
    'Optional',
    'None',
    'int',
    'float',
    'str',
    'bool',
    'True',
    'False',
    'System',
  ]
  const used = new Set(reserved)
  const root = uniqueName(identifier(rootName), used)
  const declarations: string[] = []
  const names = new Map<Schema, string>()
  const render = (node: Schema, hint: string, forced?: string): string => {
    if (node.kind === 'unknown' || node.kind === 'null')
      return language === 'java'
        ? 'Object'
        : language === 'csharp'
          ? 'object?'
          : node.kind === 'null'
            ? 'None'
            : 'Any'
    if (node.kind === 'union') {
      if (language === 'python')
        return [
          ...new Set(node.variants.map((value) => render(value, hint))),
        ].join(' | ')
      const nonNull = node.variants.filter((value) => value.kind !== 'null')
      if (nonNull.length !== 1)
        return language === 'java' ? 'Object' : 'object?'
      const type = render(nonNull[0], hint)
      return language === 'csharp' && !type.endsWith('?') ? `${type}?` : type
    }
    if (node.kind === 'array') {
      const item = render(node.item, `${hint}Item`)
      return language === 'python' ? `list[${item}]` : `List<${item}>`
    }
    if (node.kind !== 'object')
      return {
        java: { string: 'String', number: 'Double', boolean: 'Boolean' },
        python: { string: 'str', number: 'float', boolean: 'bool' },
        csharp: { string: 'string', number: 'double', boolean: 'bool' },
      }[language][node.kind]
    const existing = names.get(node)
    if (existing) return existing
    const name = forced ?? uniqueName(identifier(hint), used)
    names.set(node, name)
    const fieldNames = new Set<string>([name, ...reserved])
    const fields = [...node.properties].map(([key, property]) => {
      let type = render(property.schema, `${name}${identifier(key)}`)
      const quotedKey = JSON.stringify(key).replace(
        /[\u2028\u2029]/g,
        (value) => `\\u${value.charCodeAt(0).toString(16)}`,
      )
      if (language === 'python')
        return `    ${quotedKey}: ${property.optional ? `NotRequired[${type}]` : type}`
      const field = uniqueName(identifier(key), fieldNames)
      if (language === 'java')
        return `    @JsonProperty(${quotedKey})\n    public ${type} ${field};`
      if (property.optional && !type.endsWith('?')) type += '?'
      return `    [JsonPropertyName(${quotedKey})]\n    public ${type} ${field} { get; set; } = default!;`
    })
    if (language === 'python')
      declarations.push(
        `${name} = TypedDict(${JSON.stringify(name)}, {\n${fields.join(',\n')}\n})`,
      )
    else
      declarations.push(
        `public ${language === 'java' ? 'static ' : ''}class ${name}\n{\n${fields.join('\n\n')}\n}`,
      )
    return name
  }
  const rootType = render(
    schema,
    root,
    schema.kind === 'object' ? root : undefined,
  )
  if (language === 'python') {
    if (schema.kind !== 'object') declarations.push(`${root} = ${rootType}`)
    return (
      'from typing import Any, TypedDict, NotRequired\n\n' +
      declarations.join('\n\n') +
      '\n'
    )
  }
  if (language === 'java') {
    if (schema.kind !== 'object')
      declarations.push(
        `public static class ${root}\n{\n    public ${rootType} value;\n}`,
      )
    const rootDeclaration = declarations
      .pop()!
      .replace('public static class', 'public class')
    const nested = declarations
      .join('\n\n')
      .split('\n')
      .map((line) => `    ${line}`)
      .join('\n')
    return (
      'import java.util.List;\nimport com.fasterxml.jackson.annotation.JsonProperty;\n\n' +
      rootDeclaration.slice(0, -1) +
      (nested ? '\n' + nested + '\n' : '') +
      '}\n'
    )
  }
  if (schema.kind !== 'object') {
    const field = uniqueName('Value', new Set([root]))
    declarations.push(
      `public class ${root}\n{\n    public ${rootType} ${field} { get; set; } = default!;\n}`,
    )
  }
  return (
    '#nullable enable\nusing System.Collections.Generic;\nusing System.Text.Json.Serialization;\n\n' +
    declarations.join('\n\n') +
    '\n'
  )
}

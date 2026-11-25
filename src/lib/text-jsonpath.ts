import { JSONPath } from 'jsonpath-plus'

export class TextJsonPathError extends Error {}
const forbidden = new Set([
  '__proto__',
  'prototype',
  'constructor',
  '__defineGetter__',
  '__defineSetter__',
])
const identifier = /^[\p{L}_$][\p{L}\p{N}_$-]*/u
const quoted =
  /^(?:"(?:[^"\\\r\n]|\\["\\/bfnrt]|\\u[\da-fA-F]{4})*"|'(?:[^'\\\r\n]|\\['\\/bfnrt]|\\u[\da-fA-F]{4})*')/u

function safeProperty(property: string) {
  if (forbidden.has(property)) throw new TextJsonPathError('unsafe')
}
function readQuote(text: string, property = false): string {
  const match = quoted.exec(text)
  if (!match) throw new TextJsonPathError('invalidPath')
  // Decode escapes before checking reserved property names.
  const body = match[0]
    .slice(1, -1)
    .replace(/\\u([\da-fA-F]{4})/g, (_, code: string) =>
      String.fromCharCode(parseInt(code, 16)),
    )
  if (property) safeProperty(body)
  return match[0]
}

// A deliberately small expression grammar: values, member lookup, comparisons,
// boolean operators and grouping. No calls, assignments, computed expressions,
// global names, arithmetic, or JavaScript constructors reach the evaluator.
function validateFilter(source: string) {
  const tokens: string[] = []
  let text = source.trim()
  while (text) {
    let token: string
    if (text[0] === '"' || text[0] === "'") token = readQuote(text)
    else {
      const match =
        /^(?:===|!==|==|!=|<=|>=|&&|\|\||[!<>()[\].@]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true\b|false\b|null\b|[\p{L}_$][\p{L}\p{N}_$]*)/u.exec(
          text,
        )
      if (!match) throw new TextJsonPathError('unsafe')
      token = match[0]
    }
    tokens.push(token)
    text = text.slice(token.length).trimStart()
  }
  let cursor = 0
  const take = (value: string) => tokens[cursor] === value && ++cursor > 0
  const value = (): void => {
    if (take('!')) {
      value()
      return
    }
    if (take('(')) {
      expression()
      if (!take(')')) throw new TextJsonPathError('invalidPath')
      return
    }
    if (take('@')) {
      while (tokens[cursor] === '.' || tokens[cursor] === '[') {
        if (take('.')) {
          const key = tokens[cursor++] ?? ''
          if (!/^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(key))
            throw new TextJsonPathError('unsafe')
          safeProperty(key)
        } else {
          take('[')
          const key = tokens[cursor++] ?? ''
          if (!/^\d+$/.test(key) && !quoted.test(key))
            throw new TextJsonPathError('unsafe')
          if (quoted.test(key)) readQuote(key, true)
          if (!take(']')) throw new TextJsonPathError('invalidPath')
        }
      }
      return
    }
    const token = tokens[cursor++] ?? ''
    if (
      !/^(?:true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)$/.test(token) &&
      !quoted.test(token)
    )
      throw new TextJsonPathError('unsafe')
  }
  const comparison = () => {
    value()
    if (/^(?:===|!==|==|!=|<=|>=|<|>)$/.test(tokens[cursor] ?? '')) {
      cursor++
      value()
    }
  }
  const conjunction = () => {
    comparison()
    while (take('&&')) comparison()
  }
  const expression = () => {
    conjunction()
    while (take('||')) conjunction()
  }
  expression()
  if (cursor !== tokens.length) throw new TextJsonPathError('unsafe')
}

export function validateTextJsonPath(path: string) {
  if (path.length > 2000) throw new TextJsonPathError('limit')
  if (path[0] !== '$') throw new TextJsonPathError('invalidPath')
  let index = 1
  while (index < path.length) {
    if (path[index] === '.') {
      index++
      if (path[index] === '.') index++
      if (path[index] === '*') {
        index++
        continue
      }
      const match = identifier.exec(path.slice(index))
      if (!match) throw new TextJsonPathError('invalidPath')
      safeProperty(match[0])
      index += match[0].length
    } else if (path[index] === '[') {
      const start = ++index
      let depth = 1
      while (index < path.length && depth) {
        if (path[index] === '"' || path[index] === "'")
          index += readQuote(path.slice(index)).length
        else {
          if (path[index] === '[') depth++
          if (path[index] === ']') depth--
          if (depth) index++
        }
      }
      if (depth) throw new TextJsonPathError('invalidPath')
      const content = path.slice(start, index).trim()
      if (content.startsWith('?(') && content.endsWith(')'))
        validateFilter(content.slice(2, -1))
      else if (
        /^(?:\*|-?\d+(?:\s*,\s*-?\d+)*|-?\d*:-?\d*(?::-?\d+)?)$/.test(content)
      ) {
        if (/:0$/.test(content) && content.split(':').length === 3)
          throw new TextJsonPathError('invalidPath')
      } else {
        let rest = content
        while (rest) {
          const item = readQuote(rest, true)
          rest = rest.slice(item.length).trimStart()
          if (!rest) break
          if (rest[0] !== ',') throw new TextJsonPathError('invalidPath')
          rest = rest.slice(1).trimStart()
          if (!rest) throw new TextJsonPathError('invalidPath')
        }
        if (!content) throw new TextJsonPathError('invalidPath')
      }
      index++
    } else throw new TextJsonPathError('invalidPath')
  }
}

export function queryTextJsonPath(
  input: string,
  path: string,
  includePaths = false,
): { output: string; count: number } {
  if (input.length > 1_000_000) throw new TextJsonPathError('limit')
  let json: unknown
  try {
    json = JSON.parse(input)
  } catch {
    throw new TextJsonPathError('invalidJson')
  }
  validateTextJsonPath(path.trim())
  // Bound traversal depth/size before recursive descent or safe filter evaluation.
  const stack: [unknown, number][] = [[json, 0]]
  let nodes = 0
  while (stack.length) {
    const [node, depth] = stack.pop()!
    if (++nodes > 50_000 || depth > 64) throw new TextJsonPathError('limit')
    if (node && typeof node === 'object')
      for (const child of Object.values(node)) stack.push([child, depth + 1])
  }
  try {
    // jsonpath-plus expects an object document; handle scalar roots explicitly.
    const matches =
      path.trim() === '$'
        ? [{ path: '$', value: json }]
        : json === null || typeof json !== 'object'
          ? []
          : (JSONPath({
              path: path.trim(),
              json,
              wrap: true,
              resultType: 'all',
              eval: 'safe',
            }) as { path: string; value: unknown }[])
    const values = includePaths
      ? matches.map(({ path: matchingPath, value }) => ({
          path: matchingPath,
          value,
        }))
      : matches.map((match) => match.value)
    return { output: JSON.stringify(values, null, 2), count: matches.length }
  } catch {
    throw new TextJsonPathError('invalidPath')
  }
}

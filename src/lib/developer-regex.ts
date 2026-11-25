export interface RegexRequest {
  pattern: string
  flags: string
  text: string
  replacement: string
}
export interface RegexMatch {
  index: number
  value: string
  captures: (string | null)[]
  groups: Record<string, string | null>
}
export interface RegexResult {
  matches: RegexMatch[]
  replacement: string
  truncated: boolean
}
export type RegexError =
  | 'invalidPattern'
  | 'invalidFlags'
  | 'tooLarge'
  | 'outputTooLarge'
  | 'timeout'
  | 'workerError'

/** Only call this inside a Worker for untrusted patterns. */
export function matchRegex({
  pattern,
  flags,
  text,
  replacement,
}: RegexRequest): RegexResult {
  if (
    /[^dgimsuvy]/.test(flags) ||
    new Set(flags).size !== flags.length ||
    (flags.includes('u') && flags.includes('v'))
  )
    throw new Error('invalidFlags')
  if (
    text.length > 200_000 ||
    pattern.length > 10_000 ||
    replacement.length > 10_000
  )
    throw new Error('tooLarge')
  let regex: RegExp
  try {
    regex = new RegExp(pattern, flags)
  } catch {
    throw new Error('invalidPattern')
  }
  const matches: RegexMatch[] = []
  let found: RegExpExecArray | null
  let truncated = false
  let end = 0,
    size = 0
  const pieces: string[] = []
  while ((found = regex.exec(text)) !== null) {
    const current = found
    if (matches.length < 1000)
      matches.push({
        index: current.index,
        value: current[0],
        captures: current.slice(1).map((value) => value ?? null),
        groups: Object.fromEntries(
          Object.entries(current.groups ?? {}).map(([key, value]) => [
            key,
            value ?? null,
          ]),
        ),
      })
    else truncated = true
    const expand = (literal: string, token: string) => {
      if (token === '$') return '$'
      if (token === '&') return current[0]
      if (token === '`') return text.slice(0, current.index)
      if (token === "'") return text.slice(current.index + current[0].length)
      if (token.startsWith('<'))
        return current.groups
          ? (current.groups[token.slice(1, -1)] ?? '')
          : literal
      const number = Number(token)
      if (number > 0 && number < current.length) return current[number] ?? ''
      const first = Number(token[0])
      return token.length === 2 && first > 0 && first < current.length
        ? (current[first] ?? '') + token[1]
        : literal
    }
    let expansionSize = replacement.length
    const substitution = replacement.replace(
      /\$(\$|&|`|'|<[^>]*>|\d{1,2})/g,
      (literal, token: string) => {
        const value = expand(literal, token)
        expansionSize += value.length - literal.length
        if (size + expansionSize > 1_000_000) throw new Error('outputTooLarge')
        return value
      },
    )
    const prefix = text.slice(end, current.index)
    size += prefix.length + substitution.length
    if (size > 1_000_000) throw new Error('outputTooLarge')
    pieces.push(prefix, substitution)
    end = current.index + current[0].length
    if (!regex.global) break
    if (current[0] === '') {
      const point = text.codePointAt(regex.lastIndex)
      regex.lastIndex +=
        (regex.unicode || flags.includes('v')) &&
        point !== undefined &&
        point > 0xffff
          ? 2
          : 1
    }
  }
  if (size + text.length - end > 1_000_000) throw new Error('outputTooLarge')
  pieces.push(text.slice(end))
  return { matches, replacement: pieces.join(''), truncated }
}

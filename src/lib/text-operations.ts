export type SetOperation = 'intersection' | 'union' | 'leftOnly' | 'rightOnly'
export function textSetOperation(
  left: string,
  right: string,
  operation: SetOperation,
  ignoreCase = false,
) {
  const collect = (text: string) => {
    const values = new Map<string, string>()
    let duplicates = 0
    for (const row of text.replace(/\r\n?/g, '\n').split('\n')) {
      const value = row.trim()
      if (!value) continue
      const key = ignoreCase ? value.toLowerCase() : value
      if (values.has(key)) duplicates++
      else values.set(key, value)
    }
    return { values, duplicates }
  }
  const a = collect(left),
    b = collect(right)
  let entries: [string, string][]
  switch (operation) {
    case 'intersection':
      entries = [...a.values].filter(([key]) => b.values.has(key))
      break
    case 'leftOnly':
      entries = [...a.values].filter(([key]) => !b.values.has(key))
      break
    case 'rightOnly':
      entries = [...b.values].filter(([key]) => !a.values.has(key))
      break
    case 'union':
      entries = [
        ...a.values,
        ...[...b.values].filter(([key]) => !a.values.has(key)),
      ]
      break
  }
  return {
    output: entries.map(([, value]) => value).join('\n'),
    count: entries.length,
    duplicatesA: a.duplicates,
    duplicatesB: b.duplicates,
  }
}
export type TextCase =
  'keep' | 'upper' | 'lower' | 'camel' | 'pascal' | 'snake' | 'kebab'
export function convertTextCase(input: string, mode: TextCase) {
  if (mode === 'keep') return input
  if (mode === 'upper') return input.toUpperCase()
  if (mode === 'lower') return input.toLowerCase()
  return input
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => {
      const words =
        line
          .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
          .replace(/(\p{Ll}|\d)(\p{Lu})/gu, '$1 $2')
          .match(/[\p{L}\p{N}]+/gu) ?? []
      const lower = words.map((word) => word.toLowerCase())
      if (mode === 'snake' || mode === 'kebab')
        return lower.join(mode === 'snake' ? '_' : '-')
      return lower
        .map((word, index) =>
          index === 0 && mode === 'camel'
            ? word
            : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join('')
    })
    .join('\n')
}
export function textStatistics(input: string) {
  return {
    characters: Array.from(input).length,
    words: (input.match(/[\p{L}\p{N}]+/gu) ?? []).length,
    bytes: new TextEncoder().encode(input).length,
    lines: input ? input.split(/\r\n|\r|\n/).length : 0,
  }
}

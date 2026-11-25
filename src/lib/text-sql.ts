import { format, type SqlLanguage } from 'sql-formatter'

export type TextSqlDialect = 'sql' | 'postgresql' | 'mysql' | 'sqlite'
export type TextSqlCase = 'preserve' | 'upper' | 'lower'
type SqlToken = {
  text: string
  kind: 'space' | 'literal' | 'comment' | 'lineComment' | 'other'
}

// Quoted tokens and comments are opaque; whitespace rules never inspect them.
function tokenizeTextSql(sql: string, dialect: TextSqlDialect): SqlToken[] {
  const tokens: SqlToken[] = []
  let i = 0
  while (i < sql.length) {
    const start = i
    const char = sql[i]
    let kind: SqlToken['kind'] = 'other'
    if (/\s/u.test(char)) {
      kind = 'space'
      while (i < sql.length && /\s/u.test(sql[i])) i++
    } else if (
      sql.startsWith('--', i) ||
      (dialect === 'mysql' && char === '#')
    ) {
      kind = 'lineComment'
      while (i < sql.length && sql[i] !== '\n' && sql[i] !== '\r') i++
    } else if (sql.startsWith('/*', i)) {
      kind = 'comment'
      let depth = 1
      i += 2
      while (i < sql.length && depth) {
        if (sql.startsWith('/*', i)) {
          depth++
          i += 2
        } else if (sql.startsWith('*/', i)) {
          depth--
          i += 2
        } else i++
      }
      if (depth) throw new Error('Unterminated SQL comment')
    } else if (
      char === '$' &&
      dialect === 'postgresql' &&
      /^\$(?:[A-Za-z_][\w]*)?\$/.test(sql.slice(i))
    ) {
      kind = 'literal'
      const delimiter = /^\$(?:[A-Za-z_][\w]*)?\$/.exec(sql.slice(i))![0]
      const end = sql.indexOf(delimiter, i + delimiter.length)
      if (end < 0) throw new Error('Unterminated SQL dollar string')
      i = end + delimiter.length
    } else if (
      char === "'" ||
      char === '"' ||
      char === '`' ||
      (char === '[' && dialect === 'sqlite')
    ) {
      kind = char === "'" ? 'literal' : 'other'
      const close = char === '[' ? ']' : char
      const backslashEscapes =
        dialect === 'mysql' ||
        (dialect === 'postgresql' && /[eE]/.test(sql[i - 1] ?? ''))
      i++
      let closed = false
      while (i < sql.length) {
        if (sql[i] === '\\' && backslashEscapes) {
          i += 2
          continue
        }
        if (sql[i++] === close) {
          if (sql[i] === close) i++
          else {
            closed = true
            break
          }
        }
      }
      if (!closed) throw new Error('Unterminated SQL quote')
    } else i++
    tokens.push({ text: sql.slice(start, i), kind })
  }
  return tokens
}

function significantNewlines(tokens: SqlToken[]): Set<number> {
  const indexes = new Set<number>()
  let previousLiteral = false
  let newline = -1
  tokens.forEach((token, index) => {
    if (token.kind === 'space') {
      if (/[\r\n]/.test(token.text)) newline = index
    } else if (token.kind !== 'comment' && token.kind !== 'lineComment') {
      // SQL concatenates adjacent quoted literals only when separated by a newline.
      if (token.kind === 'literal' && previousLiteral && newline !== -1)
        indexes.add(newline)
      previousLiteral = token.kind === 'literal'
      newline = -1
    }
  })
  return indexes
}

export function compactTextSql(sql: string, dialect: TextSqlDialect): string {
  const tokens = tokenizeTextSql(sql, dialect)
  const newlines = significantNewlines(tokens)
  let result = ''
  tokens.forEach((token, index) => {
    if (token.kind === 'space') {
      if (newlines.has(index) || tokens[index - 1]?.kind === 'lineComment')
        result += '\n'
      else if (result) result += ' '
    } else result += token.text
  })
  return result.trim()
}

export function transformTextSql(
  input: string,
  options: {
    dialect: TextSqlDialect
    indent: number
    keywordCase: TextSqlCase
  },
  minify = false,
): string {
  const tokens = tokenizeTextSql(input, options.dialect)
  const newlines = significantNewlines(tokens)
  // The formatter otherwise removes semantically significant literal separators.
  let marker = '/*__toolkit_literal_newline__*/'
  while (input.includes(marker)) marker = marker.replace('__*/', '_x__*/')
  const protectedSql = tokens
    .map((token, index) => (newlines.has(index) ? `\n${marker}\n` : token.text))
    .join('')
  const formatted = format(protectedSql, {
    language: options.dialect as SqlLanguage,
    tabWidth: options.indent,
    keywordCase: options.keywordCase,
  }).replaceAll(marker, '\n')
  return minify ? compactTextSql(formatted, options.dialect) : formatted
}

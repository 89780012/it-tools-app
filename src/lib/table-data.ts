import Papa from 'papaparse'
import {
  parse as parseLossless,
  stringify as stringifyLossless,
  isLosslessNumber,
} from 'lossless-json'
export interface DataTable {
  columns: string[]
  rows: string[][]
}
export function parseTable(input: string, delimiter = ''): DataTable {
  if (input.length > 5_000_000) throw new Error('tooLarge')
  if (delimiter && (delimiter.length !== 1 || /["\r\n]/.test(delimiter)))
    throw new Error('invalid')
  // Papa removes a leading BOM before reporting cursor positions.
  input = input.replace(/^\uFEFF/, '')
  const data: string[][] = []
  let cursor = 0
  Papa.parse<string[]>(input, {
    delimiter,
    step(result) {
      if (result.errors.some((error) => error.code !== 'UndetectableDelimiter'))
        throw new Error('invalid')
      const raw = input.slice(cursor, result.meta.cursor)
      cursor = result.meta.cursor
      // Ignore physical blank lines, but retain quoted empty and whitespace records.
      if (/^(?:\r\n|\r|\n)?$/.test(raw)) return
      if (data.length >= 50_001 || result.data.length > 200)
        throw new Error('tooLarge')
      data.push(result.data)
    },
  })
  const [columns = [], ...rows] = data
  if (
    !columns.length ||
    new Set(columns).size !== columns.length ||
    columns.some((name) => !name.trim()) ||
    rows.some((row) => row.length !== columns.length)
  )
    throw new Error('columns')
  if (rows.length > 50_000 || columns.length > 200) throw new Error('tooLarge')
  return { columns, rows }
}
export function mergeTables(tables: DataTable[]): DataTable {
  if (!tables.length) throw new Error('invalid')
  const columns = [...new Set(tables.flatMap((table) => table.columns))]
  if (columns.length > 200) throw new Error('tooLarge')
  const rows = tables.flatMap((table) => {
    const indices = columns.map((name) => table.columns.indexOf(name))
    return table.rows.map((row) =>
      indices.map((index) => (index < 0 ? '' : row[index])),
    )
  })
  if (rows.length > 50_000) throw new Error('tooLarge')
  return { columns, rows }
}
export interface TableOptions {
  selected: string[]
  query: string
  sortColumn: string
  descending: boolean
  dedupeColumn: string
}
export function transformTable(
  table: DataTable,
  options: TableOptions,
): DataTable {
  const indices = options.selected.map((name) => table.columns.indexOf(name))
  if (!indices.length || indices.some((index) => index < 0))
    throw new Error('columns')
  let rows = table.rows.filter((row) =>
    row.some((cell) =>
      cell.toLowerCase().includes(options.query.toLowerCase()),
    ),
  )
  if (options.dedupeColumn) {
    const index = table.columns.indexOf(options.dedupeColumn)
    if (index < 0) throw new Error('columns')
    const seen = new Set<string>()
    rows = rows.filter((row) => {
      if (seen.has(row[index])) return false
      seen.add(row[index])
      return true
    })
  }
  if (options.sortColumn) {
    const index = table.columns.indexOf(options.sortColumn)
    if (index < 0) throw new Error('columns')
    rows = [...rows].sort(
      (a, b) =>
        a[index].localeCompare(b[index], undefined, { numeric: true }) *
        (options.descending ? -1 : 1),
    )
  }
  return {
    columns: options.selected,
    rows: rows.map((row) => indices.map((index) => row[index])),
  }
}
export function exportTable(table: DataTable, delimiter = ',') {
  return Papa.unparse([table.columns, ...table.rows], {
    delimiter,
    newline: '\r\n',
    quotes: (value) => value === '',
  })
}
export type SqlDialect = 'postgres' | 'mysql' | 'sqlite' | 'sqlserver'
export function generateInsert(
  input: string,
  format: 'json' | 'csv',
  tableName: string,
  dialect: SqlDialect,
  batchSize = 100,
  selected?: string[],
) {
  if (
    input.length > 5_000_000 ||
    !tableName.trim() ||
    !Number.isInteger(batchSize) ||
    batchSize < 1 ||
    batchSize > 1000
  )
    throw new Error('invalid')
  let records: Record<string, unknown>[]
  if (format === 'csv') {
    const table = parseTable(input)
    records = table.rows.map((row) =>
      Object.fromEntries(table.columns.map((key, index) => [key, row[index]])),
    )
  } else {
    const parsed: unknown = parseLossless(input)
    records = (Array.isArray(parsed) ? parsed : [parsed]) as Record<
      string,
      unknown
    >[]
    if (
      !records.length ||
      records.length > 50_000 ||
      records.some(
        (row) =>
          !row ||
          typeof row !== 'object' ||
          Array.isArray(row) ||
          isLosslessNumber(row),
      )
    )
      throw new Error('invalid')
  }
  const available = [...new Set(records.flatMap((row) => Object.keys(row)))]
  const columns = selected ?? available
  if (
    new Set(columns).size !== columns.length ||
    columns.some((column) => !available.includes(column)) ||
    !columns.length ||
    columns.length > 200
  )
    throw new Error('columns')
  const quoteName = (value: string) => {
    if (!value || /[\u0000-\u001f]/.test(value)) throw new Error('invalid')
    if (dialect === 'mysql') return '`' + value.replaceAll('`', '``') + '`'
    if (dialect === 'sqlserver') return '[' + value.replaceAll(']', ']]') + ']'
    return '"' + value.replaceAll('"', '""') + '"'
  }
  const literal = (value: unknown): string => {
    if (value === null || value === undefined) return 'NULL'
    if (isLosslessNumber(value)) return value.value
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('invalid')
      return String(value)
    }
    if (typeof value === 'boolean')
      return dialect === 'postgres'
        ? String(value).toUpperCase()
        : value
          ? '1'
          : '0'
    const text = typeof value === 'string' ? value : stringifyLossless(value)!
    if (text.includes('\0')) throw new Error('invalid')
    // Encode MySQL strings as UTF-8 hex to avoid dependence on NO_BACKSLASH_ESCAPES.
    if (dialect === 'mysql')
      return `CONVERT(X'${Array.from(new TextEncoder().encode(text), (byte) => byte.toString(16).padStart(2, '0')).join('')}' USING utf8mb4)`
    if (dialect === 'postgres' && text.includes('\\'))
      return `E'${text.replaceAll('\\', '\\\\').replaceAll("'", "''")}'`
    return `${dialect === 'sqlserver' ? 'N' : ''}'${text.replaceAll("'", "''")}'`
  }
  const header = `INSERT INTO ${quoteName(tableName)} (${columns.map(quoteName).join(', ')}) VALUES\n`
  const statements: string[] = []
  for (let offset = 0; offset < records.length; offset += batchSize) {
    statements.push(
      header +
        records
          .slice(offset, offset + batchSize)
          .map(
            (row) =>
              '(' +
              columns
                .map((key) =>
                  literal(Object.hasOwn(row, key) ? row[key] : null),
                )
                .join(', ') +
              ')',
          )
          .join(',\n') +
        ';',
    )
  }
  return statements.join('\n\n')
}

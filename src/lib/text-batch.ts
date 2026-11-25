export interface TextBatchOptions {
  trim: boolean
  dropBlank: boolean
  dedupe: boolean
  sort: 'none' | 'asc' | 'desc'
  prefix: string
  suffix: string
  delimiter: string
  sqlIn: boolean
}
export const textBatchDefaults: TextBatchOptions = {
  trim: true,
  dropBlank: true,
  dedupe: false,
  sort: 'none',
  prefix: '',
  suffix: '',
  delimiter: '\n',
  sqlIn: false,
}

export function processTextBatch(
  input: string,
  options: TextBatchOptions,
  locale = 'en',
) {
  let rows = input === '' ? [] : input.replace(/\r\n?/g, '\n').split('\n')
  const inputCount = rows.length
  if (options.trim) rows = rows.map((row) => row.trim())
  if (options.dropBlank) rows = rows.filter((row) => row.trim() !== '')
  if (options.dedupe) rows = [...new Set(rows)]
  if (options.sort !== 'none') {
    const collator = new Intl.Collator(locale, {
      usage: 'sort',
      sensitivity: 'variant',
      numeric: true,
    })
    rows.sort(
      (a, b) =>
        (collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0)) *
        (options.sort === 'desc' ? -1 : 1),
    )
  }
  rows = rows.map((row) => options.prefix + row + options.suffix)
  // Standard SQL strings use doubled apostrophes. Reject backslashes because
  // their interpretation depends on the database's string-literal mode.
  if (
    options.sqlIn &&
    rows.some((row) => row.includes('\\') || row.includes('\0'))
  )
    throw new Error('sqlUnsafe')
  const output = options.sqlIn
    ? rows.length
      ? `IN (${rows.map((row) => `'${row.replaceAll("'", "''")}'`).join(', ')})`
      : ''
    : rows.join(options.delimiter)
  return {
    output,
    inputCount,
    outputCount: rows.length,
    characters: Array.from(output).length,
  }
}

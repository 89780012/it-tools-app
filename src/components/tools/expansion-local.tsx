import { useEffect, useRef, useState } from 'react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Workbench, Panel, Field, Output, ErrorMessage } from './workbench'
import { hashFile, matchesHash, type HashAlgorithm } from '@/lib/file-hash'
import { textSetOperation, type SetOperation } from '@/lib/text-operations'
import {
  parsePermissions,
  permissionCommand,
  symbolicPermissions,
} from '@/lib/chmod'
import {
  parseTable,
  mergeTables,
  transformTable,
  exportTable,
  generateInsert,
  type DataTable,
  type SqlDialect,
} from '@/lib/table-data'
import { frontendLoadImage } from '@/lib/frontend-image'
import jsQR from 'jsqr'

export const selectClass = 'w-full rounded-md border bg-background p-2 text-sm'
export function FileHashTool() {
  const t = useTranslations('expansion')
  const [files, setFiles] = useState<File[]>([])
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256')
  const [expected, setExpected] = useState('')
  const [results, setResults] = useState<{ name: string; hash: string }[]>([])
  const [progress, setProgress] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const reset = () => {
    controller.current?.abort()
    controller.current = null
    setBusy(false)
    setResults([])
    setProgress(0)
    setError('')
  }
  const run = async () => {
    reset()
    const current = new AbortController()
    controller.current = current
    setBusy(true)
    try {
      for (let index = 0; index < files.length; index++) {
        const hash = await hashFile(
          files[index],
          algorithm,
          (fraction) => setProgress((index + fraction) / files.length),
          current.signal,
        )
        if (current.signal.aborted) return
        setResults((previous) => [
          ...previous,
          { name: files[index].name, hash },
        ])
      }
    } catch {
      if (!current.signal.aborted) setError(t('invalid'))
    } finally {
      if (controller.current === current) setBusy(false)
    }
  }
  const choose = (items: File[]) => {
    reset()
    setFiles(items.slice(0, 100))
  }
  return (
    <Workbench toolId="file-hash">
      <Panel title={t('files')}>
        <div
          className="rounded border border-dashed p-5"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            choose(Array.from(event.dataTransfer.files))
          }}
        >
          <Field label={t('files')}>
            <Input
              aria-label={t('files')}
              data-testid="hash-files"
              type="file"
              multiple
              onChange={(event) => choose(Array.from(event.target.files ?? []))}
            />
          </Field>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('fileHashHint')}
          </p>
          {files.map((file, index) => (
            <p className="break-all text-sm" key={index}>
              {file.name} ({file.size.toLocaleString()} B)
            </p>
          ))}
        </div>
        <Field label={t('algorithm')}>
          <select
            className={selectClass}
            aria-label={t('algorithm')}
            value={algorithm}
            onChange={(event) => {
              reset()
              setAlgorithm(event.target.value as HashAlgorithm)
            }}
          >
            {(['MD5', 'SHA-256', 'SHA-512'] as const).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>
        <Field label={t('expectedHash')}>
          <Input
            aria-label={t('expectedHash')}
            value={expected}
            onChange={(event) => setExpected(event.target.value)}
          />
        </Field>
        <div className="flex gap-2">
          <Button onClick={run} disabled={busy || !files.length}>
            {t('run')}
          </Button>
          <Button variant="outline" disabled={!busy} onClick={reset}>
            {t('cancel')}
          </Button>
        </div>
        {busy && (
          <progress
            className="w-full"
            aria-label={t('progress')}
            max={1}
            value={progress}
          />
        )}
        <ErrorMessage>{error}</ErrorMessage>
      </Panel>
      {results.map((result, index) => (
        <Panel key={index} title={result.name}>
          <Output
            value={result.hash}
            filename={`${result.name}.${algorithm.toLowerCase()}.txt`}
          />
          {expected.trim() && (
            <p role="status">
              {t(
                matchesHash(result.hash, expected)
                  ? 'hashMatch'
                  : 'hashMismatch',
              )}
            </p>
          )}
        </Panel>
      ))}
    </Workbench>
  )
}

export function TextSetTool() {
  const t = useTranslations('expansion')
  const [left, setLeft] = useState(''),
    [right, setRight] = useState(''),
    [operation, setOperation] = useState<SetOperation>('intersection'),
    [ignoreCase, setIgnoreCase] = useState(false)
  const result = textSetOperation(left, right, operation, ignoreCase)
  return (
    <Workbench toolId="text-set-operations">
      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            ['left', left, setLeft],
            ['right', right, setRight],
          ] as const
        ).map(([key, value, update]) => (
          <Panel key={key} title={t(key)}>
            <Textarea
              data-testid={`set-${key}`}
              className="min-h-64 font-mono"
              aria-label={t(key)}
              value={value}
              maxLength={1_000_000}
              onChange={(event) => update(event.target.value)}
            />
          </Panel>
        ))}
      </div>
      <Panel title={t('options')}>
        <Field label={t('operation')}>
          <select
            aria-label={t('operation')}
            className={selectClass}
            value={operation}
            onChange={(event) =>
              setOperation(event.target.value as SetOperation)
            }
          >
            {['intersection', 'union', 'leftOnly', 'rightOnly'].map((value) => (
              <option value={value} key={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={ignoreCase}
            onChange={(event) => setIgnoreCase(event.target.checked)}
          />
          {t('ignoreCase')}
        </label>
      </Panel>
      <Panel title={t('result')}>
        <Output value={result.output} />
        <p role="status">
          {t('setCounts', {
            count: result.count,
            a: result.duplicatesA,
            b: result.duplicatesB,
          })}
        </p>
      </Panel>
    </Workbench>
  )
}

export function ChmodTool() {
  const t = useTranslations('expansion')
  const [input, setInput] = useState('755'),
    [path, setPath] = useState('file.txt')
  let mode = 0,
    error = ''
  try {
    mode = parsePermissions(input)
  } catch {
    error = t('invalid')
  }
  return (
    <Workbench toolId="chmod-calculator">
      <Panel title={t('permissions')}>
        <Field label={t('permissionInput')}>
          <Input
            aria-label={t('permissionInput')}
            data-testid="chmod-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          {['owner', 'group', 'others'].map((group, index) => (
            <fieldset key={group} className="space-y-2 rounded border p-3">
              <legend>{t(group)}</legend>
              {['read', 'write', 'execute'].map((permission, bit) => {
                const mask = 1 << ((2 - index) * 3 + 2 - bit)
                return (
                  <label key={permission} className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={!!(mode & mask)}
                      onChange={(event) =>
                        setInput(
                          (event.target.checked ? mode | mask : mode & ~mask)
                            .toString(8)
                            .padStart(3, '0'),
                        )
                      }
                    />
                    {t(permission)}
                  </label>
                )
              })}
            </fieldset>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {['setuid', 'setgid', 'sticky'].map((name, index) => {
            const mask = 1 << (11 - index)
            return (
              <label key={name} className="flex gap-2">
                <input
                  type="checkbox"
                  checked={!!(mode & mask)}
                  onChange={(event) =>
                    setInput(
                      (event.target.checked ? mode | mask : mode & ~mask)
                        .toString(8)
                        .padStart(3, '0'),
                    )
                  }
                />
                {name}
              </label>
            )
          })}
        </div>
        <Field label={t('path')}>
          <Input
            aria-label={t('path')}
            value={path}
            onChange={(event) => setPath(event.target.value)}
          />
        </Field>
        <ErrorMessage>{error}</ErrorMessage>
        <Output
          value={
            error
              ? ''
              : `${mode.toString(8).padStart(3, '0')}\n${symbolicPermissions(mode)}\n${permissionCommand(mode, path)}`
          }
          filename="permissions.sh"
        />
      </Panel>
    </Workbench>
  )
}

export function QrReaderTool() {
  const t = useTranslations('expansion')
  const [result, setResult] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const revision = useRef(0)
  useEffect(
    () => () => {
      revision.current++
    },
    [],
  )
  const read = async (file?: File) => {
    const token = ++revision.current
    setResult('')
    setError('')
    if (!file) {
      setBusy(false)
      return
    }
    setBusy(true)
    let url: string | undefined
    try {
      const loaded = await frontendLoadImage(file)
      url = loaded.url
      const canvas = document.createElement('canvas')
      const scale = Math.min(
        1,
        2400 / Math.max(loaded.image.naturalWidth, loaded.image.naturalHeight),
      )
      canvas.width = Math.max(1, Math.round(loaded.image.naturalWidth * scale))
      canvas.height = Math.max(
        1,
        Math.round(loaded.image.naturalHeight * scale),
      )
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('invalid')
      context.drawImage(loaded.image, 0, 0, canvas.width, canvas.height)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(pixels.data, pixels.width, pixels.height, {
        inversionAttempts: 'attemptBoth',
      })
      canvas.width = 0
      canvas.height = 0
      if (token !== revision.current) return
      if (!code) setError(t('qrMissing'))
      else setResult(code.data)
    } catch {
      if (token === revision.current) setError(t('invalidImage'))
    } finally {
      if (url) URL.revokeObjectURL(url)
      if (token === revision.current) setBusy(false)
    }
  }
  return (
    <Workbench toolId="qr-code-reader">
      <Panel title={t('image')}>
        <div
          tabIndex={0}
          className="rounded border border-dashed p-6"
          onPaste={(event) => {
            const file = Array.from(event.clipboardData.files)[0]
            if (file) {
              event.preventDefault()
              void read(file)
            }
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            void read(event.dataTransfer.files[0])
          }}
        >
          <Field label={t('image')}>
            <Input
              aria-label={t('image')}
              data-testid="qr-reader-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => void read(event.target.files?.[0])}
            />
          </Field>
          <p className="mt-3 text-sm text-muted-foreground">{t('qrHint')}</p>
        </div>
        {busy && <p role="status">{t('processing')}</p>}
        <ErrorMessage>{error}</ErrorMessage>
      </Panel>
      <Panel title={t('result')}>
        <Output value={result} filename="qr-content.txt" />
      </Panel>
    </Workbench>
  )
}

export function TableTool() {
  const t = useTranslations('expansion')
  const [input, setInput] = useState(''),
    [delimiter, setDelimiter] = useState(''),
    [table, setTable] = useState<DataTable | null>(null),
    [error, setError] = useState('')
  const [selected, setSelected] = useState<string[]>([]),
    [query, setQuery] = useState(''),
    [sortColumn, setSortColumn] = useState(''),
    [descending, setDescending] = useState(false),
    [dedupeColumn, setDedupeColumn] = useState('')
  const revision = useRef(0)
  useEffect(
    () => () => {
      revision.current++
    },
    [],
  )
  const install = (next: DataTable) => {
    setTable(next)
    setSelected(next.columns)
    setSortColumn('')
    setDedupeColumn('')
    setQuery('')
    setError('')
  }
  const run = () => {
    revision.current++
    try {
      install(parseTable(input, delimiter))
    } catch {
      setTable(null)
      setError(t('invalidTable'))
    }
  }
  const upload = async (files: File[]) => {
    const token = ++revision.current
    setTable(null)
    setError('')
    try {
      if (!files.length) return
      if (files.reduce((sum, file) => sum + file.size, 0) > 5_000_000)
        throw new Error('tooLarge')
      const tables = await Promise.all(
        files.map(async (file) => parseTable(await file.text(), delimiter)),
      )
      if (token === revision.current) install(mergeTables(tables))
    } catch {
      if (token === revision.current) setError(t('invalidTable'))
    }
  }
  let result: DataTable | null = null
  if (table && selected.length)
    result = transformTable(table, {
      selected,
      query,
      sortColumn,
      descending,
      dedupeColumn,
    })
  return (
    <Workbench toolId="csv-table-editor">
      <Panel title={t('input')}>
        <Field label={t('delimiter')}>
          <select
            aria-label={t('delimiter')}
            className={selectClass}
            value={delimiter}
            onChange={(event) => {
              revision.current++
              setDelimiter(event.target.value)
              setTable(null)
            }}
          >
            {[
              ['', 'auto'],
              [',', 'comma'],
              ['\t', 'tab'],
              [';', 'semicolon'],
            ].map(([value, label]) => (
              <option key={label} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('customDelimiter')}>
          <Input
            aria-label={t('customDelimiter')}
            maxLength={1}
            value={delimiter}
            onChange={(event) => {
              revision.current++
              setDelimiter(event.target.value)
              setTable(null)
            }}
          />
        </Field>
        <Textarea
          data-testid="table-input"
          className="min-h-40 font-mono"
          aria-label={t('input')}
          value={input}
          onChange={(event) => {
            revision.current++
            setInput(event.target.value)
            setTable(null)
            setError('')
          }}
        />
        <div className="flex flex-wrap gap-3">
          <Button data-testid="table-run" onClick={run}>
            {t('run')}
          </Button>
          <Input
            className="max-w-md"
            aria-label={t('mergeFiles')}
            type="file"
            multiple
            accept=".csv,.tsv,.txt"
            onChange={(event) =>
              void upload(Array.from(event.target.files ?? []))
            }
          />
        </div>
        <p className="text-sm text-muted-foreground">{t('tableHint')}</p>
        <ErrorMessage>{error}</ErrorMessage>
      </Panel>
      {table && (
        <Panel title={t('options')}>
          <Field label={t('filter')}>
            <Input
              aria-label={t('filter')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ['sort', sortColumn, setSortColumn],
                ['dedupeColumn', dedupeColumn, setDedupeColumn],
              ] as const
            ).map(([key, value, update]) => (
              <Field label={t(key)} key={key}>
                <select
                  aria-label={t(key)}
                  className={selectClass}
                  value={value}
                  onChange={(event) => update(event.target.value)}
                >
                  <option value="">{t('none')}</option>
                  {table.columns.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={descending}
              onChange={(event) => setDescending(event.target.checked)}
            />
            {t('descending')}
          </label>
          <fieldset>
            <legend>{t('columns')}</legend>
            <div className="flex flex-wrap gap-3">
              {table.columns.map((name) => (
                <label className="flex gap-2" key={name}>
                  <input
                    type="checkbox"
                    checked={selected.includes(name)}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? table.columns.filter(
                              (column) =>
                                column === name || selected.includes(column),
                            )
                          : selected.filter((column) => column !== name),
                      )
                    }
                  />
                  {name}
                </label>
              ))}
            </div>
          </fieldset>
        </Panel>
      )}
      {result && (
        <Panel title={t('result')}>
          <p>{t('rowCount', { count: result.rows.length })}</p>
          <div className="max-h-96 overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {result.columns.map((name) => (
                    <th className="border p-2 text-start" key={name}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 100).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td className="border p-2" key={j}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">{t('previewLimit')}</p>
          <Output
            value={exportTable(result, delimiter || ',')}
            filename={delimiter === '\t' ? 'table.tsv' : 'table.csv'}
          />
        </Panel>
      )}
    </Workbench>
  )
}

export function SqlInsertTool() {
  const t = useTranslations('expansion')
  const [input, setInput] = useState(''),
    [format, setFormat] = useState<'json' | 'csv'>('json'),
    [name, setName] = useState('users'),
    [dialect, setDialect] = useState<SqlDialect>('postgres'),
    [batch, setBatch] = useState(100),
    [columns, setColumns] = useState(''),
    [result, setResult] = useState(''),
    [error, setError] = useState('')
  const reset = () => {
    setResult('')
    setError('')
  }
  const run = () => {
    reset()
    try {
      setResult(
        generateInsert(
          input,
          format,
          name,
          dialect,
          batch,
          columns.trim()
            ? columns
                .split('\n')
                .map((column) => column.trim())
                .filter(Boolean)
            : undefined,
        ),
      )
    } catch {
      setError(t('invalidSql'))
    }
  }
  return (
    <Workbench toolId="data-to-sql">
      <Panel title={t('input')}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('format')}>
            <select
              aria-label={t('format')}
              className={selectClass}
              value={format}
              onChange={(event) => {
                reset()
                setFormat(event.target.value as 'json' | 'csv')
              }}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </Field>
          <Field label={t('dialect')}>
            <select
              aria-label={t('dialect')}
              className={selectClass}
              value={dialect}
              onChange={(event) => {
                reset()
                setDialect(event.target.value as SqlDialect)
              }}
            >
              {[
                ['postgres', 'PostgreSQL'],
                ['mysql', 'MySQL'],
                ['sqlite', 'SQLite'],
                ['sqlserver', 'SQL Server'],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('tableName')}>
            <Input
              aria-label={t('tableName')}
              value={name}
              onChange={(event) => {
                reset()
                setName(event.target.value)
              }}
            />
          </Field>
          <Field label={t('batchSize')}>
            <Input
              aria-label={t('batchSize')}
              type="number"
              min={1}
              max={1000}
              value={batch}
              onChange={(event) => {
                reset()
                setBatch(Number(event.target.value))
              }}
            />
          </Field>
        </div>
        <Field label={t('columnsHint')}>
          <Textarea
            aria-label={t('columnsHint')}
            value={columns}
            onChange={(event) => {
              reset()
              setColumns(event.target.value)
            }}
          />
        </Field>
        <Field label={t('input')}>
          <Textarea
            aria-label={t('input')}
            data-testid="sql-insert-input"
            className="min-h-64 font-mono"
            value={input}
            onChange={(event) => {
              reset()
              setInput(event.target.value)
            }}
          />
        </Field>
        <p className="text-sm text-muted-foreground">{t('sqlHint')}</p>
        <Button data-testid="sql-insert-run" onClick={run}>
          {t('run')}
        </Button>
        <ErrorMessage>{error}</ErrorMessage>
      </Panel>
      <Panel title={t('result')}>
        <Output value={result} filename="insert.sql" />
      </Panel>
    </Workbench>
  )
}

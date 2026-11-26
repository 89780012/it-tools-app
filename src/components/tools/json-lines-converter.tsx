import { useEffect, useRef, useState } from 'react'
import { Copy, Download } from 'lucide-react'
import { useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Workbench,
  Panel,
  Field,
  ErrorMessage,
  downloadText,
} from './workbench'
import {
  convertJsonLines,
  JsonLinesError,
  JSON_LINES_MAX_BYTES,
  type JsonLinesDirection,
  type JsonLinesResult,
} from '@/lib/json-lines'

const examples = {
  toLines:
    '[\n  {"id":9007199254740993,"name":"Ada","active":true},\n  {"id":9007199254740994,"name":"林","tags":["logs","data"]}\n]',
  toJson:
    '{"id":9007199254740993,"name":"Ada","active":true}\n{"id":9007199254740994,"name":"林","tags":["logs","data"]}\n',
}

export function JsonLinesConverter() {
  const t = useTranslations('jsonLines')
  const w = useTranslations('workbench')
  const [direction, setDirection] = useState<JsonLinesDirection>('toLines')
  const [input, setInput] = useState('')
  const [skipBlankLines, setSkipBlankLines] = useState(true)
  const [result, setResult] = useState<JsonLinesResult | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reading, setReading] = useState(false)
  const revision = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(
    () => () => {
      revision.current++
    },
    [],
  )

  const invalidate = () => {
    revision.current++
    setReading(false)
    setResult(null)
    setError('')
    setNotice('')
  }
  const edit = (value: string) => {
    invalidate()
    setInput(value)
    if (fileInput.current) fileInput.current.value = ''
  }
  const run = () => {
    invalidate()
    try {
      setResult(convertJsonLines(input, direction, skipBlankLines))
    } catch (cause) {
      setError(
        cause instanceof JsonLinesError
          ? t(`errors.${cause.code}`, { line: cause.line })
          : w('error'),
      )
    }
  }
  const importFile = async (file?: File) => {
    if (!file) return
    invalidate()
    setInput('')
    if (file.size > JSON_LINES_MAX_BYTES) {
      setError(t('errors.tooLarge'))
      return
    }
    const current = revision.current
    setReading(true)
    try {
      const bytes = await file.arrayBuffer()
      if (current !== revision.current) return
      let text: string
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      } catch {
        setError(t('errors.encoding'))
        return
      }
      setInput(text)
      if (/\.(jsonl|ndjson)$/i.test(file.name)) setDirection('toJson')
      else if (/\.json$/i.test(file.name)) setDirection('toLines')
    } catch {
      if (current === revision.current) setError(t('errors.fileRead'))
    } finally {
      if (current === revision.current) setReading(false)
    }
  }

  return (
    <Workbench toolId="json-lines-converter">
      <p className="text-sm text-muted-foreground">{t('hint')}</p>
      <Panel title={w('options')}>
        <Field label={t('direction')} htmlFor="json-lines-direction">
          <select
            id="json-lines-direction"
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={direction}
            onChange={(event) => {
              invalidate()
              setDirection(event.target.value as JsonLinesDirection)
            }}
          >
            <option value="toLines">{t('toLines')}</option>
            <option value="toJson">{t('toJson')}</option>
          </select>
        </Field>
        {direction === 'toJson' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={skipBlankLines}
              onChange={(event) => {
                invalidate()
                setSkipBlankLines(event.target.checked)
              }}
            />
            {t('skipBlankLines')}
          </label>
        )}
      </Panel>
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Panel title={w('input')}>
          <Field
            label={t('file')}
            htmlFor="json-lines-file"
            hint={t('fileHint')}
          >
            <Input
              ref={fileInput}
              id="json-lines-file"
              type="file"
              accept=".json,.jsonl,.ndjson,.txt,application/json,application/x-ndjson"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                void importFile(file)
              }}
            />
          </Field>
          <Field
            label={direction === 'toLines' ? t('jsonInput') : t('linesInput')}
            htmlFor="json-lines-input"
          >
            <Textarea
              id="json-lines-input"
              data-testid="json-lines-input"
              dir="ltr"
              spellCheck={false}
              className="min-h-72 font-mono text-sm"
              value={input}
              onChange={(event) => edit(event.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button onClick={run} disabled={reading}>
              {t('convert')}
            </Button>
            <Button variant="outline" onClick={() => edit(examples[direction])}>
              {w('example')}
            </Button>
            <Button variant="outline" onClick={() => edit('')}>
              {w('clear')}
            </Button>
          </div>
          {reading && (
            <p role="status" className="text-sm">
              {t('reading')}
            </p>
          )}
          <ErrorMessage>{error}</ErrorMessage>
        </Panel>
        <Panel title={w('result')}>
          <Field label={w('output')} htmlFor="json-lines-output">
            <Textarea
              id="json-lines-output"
              data-testid="tool-output"
              readOnly
              dir="ltr"
              spellCheck={false}
              className="min-h-72 font-mono text-sm"
              value={result?.output ?? ''}
            />
          </Field>
          <div className="text-sm text-muted-foreground" role="status">
            {result &&
              t('counts', { count: result.records, skipped: result.skipped })}
            {result?.records === 0 && <p>{t('emptyResult')}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!result}
              onClick={async () => {
                if (!result) return
                const current = revision.current
                try {
                  await navigator.clipboard.writeText(result.output)
                  if (current === revision.current) setNotice(w('copied'))
                } catch {
                  if (current === revision.current) setNotice(w('copyError'))
                }
              }}
            >
              <Copy className="me-2 size-4" />
              {w('copy')}
            </Button>
            <Button
              variant="outline"
              disabled={!result}
              onClick={() => {
                if (!result) return
                try {
                  downloadText(
                    result.output,
                    direction === 'toLines' ? 'result.jsonl' : 'result.json',
                    direction === 'toLines'
                      ? 'application/x-ndjson;charset=utf-8'
                      : 'application/json;charset=utf-8',
                  )
                } catch {
                  setNotice(t('errors.download'))
                }
              }}
            >
              <Download className="me-2 size-4" />
              {w('download')}
            </Button>
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {notice}
          </p>
        </Panel>
      </div>
      <p className="text-sm text-muted-foreground">{t('rules')}</p>
    </Workbench>
  )
}

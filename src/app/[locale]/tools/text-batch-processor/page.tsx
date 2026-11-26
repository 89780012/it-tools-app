import { TextExtras } from '@/components/tools/text-extras'
import { Link } from '@/i18n/navigation'
import { useState } from 'react'
import { useLocale, useTranslations } from '@/i18n/compat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Workbench,
  Field,
  Panel,
  ErrorMessage,
  Output,
} from '@/components/tools/workbench'
import {
  processTextBatch,
  textBatchDefaults,
  type TextBatchOptions,
} from '@/lib/text-batch'

export default function TextBatchProcessorPage() {
  const t = useTranslations('tools.text-batch-processor')
  const w = useTranslations('workbench')
  const x = useTranslations('expansion')
  const toolNames = useTranslations('tools')
  const [showExtras, setShowExtras] = useState(false)
  const locale = useLocale()
  const [input, setInput] = useState('')
  const [options, setOptions] = useState({ ...textBatchDefaults })
  const [result, setResult] = useState<ReturnType<
    typeof processTextBatch
  > | null>(null)
  const [error, setError] = useState('')
  const reset = () => {
    setResult(null)
    setError('')
  }
  const changeInput = (value: string) => {
    setInput(value)
    reset()
  }
  const option = <K extends keyof TextBatchOptions>(
    key: K,
    value: TextBatchOptions[K],
  ) => {
    setOptions((previous) => ({ ...previous, [key]: value }))
    reset()
  }
  const run = () => {
    reset()
    try {
      setResult(processTextBatch(input, options, locale))
    } catch {
      setError(t('sqlUnsafe'))
    }
  }
  return (
    <Workbench toolId="text-batch-processor">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={w('input')}>
          <Field label={w('input')} htmlFor="batch-input">
            <Textarea
              id="batch-input"
              data-testid="batch-input"
              className="min-h-64 font-mono"
              value={input}
              onChange={(e) => changeInput(e.target.value)}
              spellCheck={false}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['trim', 'dropBlank', 'dedupe', 'sqlIn'] as const).map((key) => (
              <label className="flex items-center gap-2 text-sm" key={key}>
                <input
                  type="checkbox"
                  data-testid={`batch-${key}`}
                  checked={options[key]}
                  onChange={(e) => option(key, e.target.checked)}
                />
                {t(key)}
              </label>
            ))}
          </div>
          <Field label={t('sort')} htmlFor="batch-sort">
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              id="batch-sort"
              data-testid="batch-sort"
              value={options.sort}
              onChange={(e) =>
                option('sort', e.target.value as TextBatchOptions['sort'])
              }
            >
              {(['none', 'asc', 'desc'] as const).map((value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            {(['prefix', 'suffix'] as const).map((key) => (
              <Field key={key} label={t(key)} htmlFor={`batch-${key}`}>
                <Input
                  id={`batch-${key}`}
                  data-testid={`batch-${key}`}
                  value={options[key]}
                  onChange={(e) => option(key, e.target.value)}
                />
              </Field>
            ))}
          </div>
          <Field label={t('delimiter')} htmlFor="batch-delimiter">
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              id="batch-delimiter"
              data-testid="batch-delimiter"
              disabled={options.sqlIn}
              value={options.delimiter}
              onChange={(e) => option('delimiter', e.target.value)}
            >
              <option value={'\n'}>{t('newline')}</option>
              <option value=", ">{t('comma')}</option>
              <option value=" ">{t('space')}</option>
              <option value={'\t'}>{t('tab')}</option>
              <option value="">{t('empty')}</option>
            </select>
          </Field>
          <p className="text-xs text-muted-foreground">{t('hint')}</p>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="batch-run" onClick={run}>
              {w('run')}
            </Button>
            <Button
              data-testid="batch-example"
              variant="outline"
              onClick={() =>
                changeInput("  Ada\n林\nAda\n\nO'Reilly\nitem10\nitem2")
              }
            >
              {w('example')}
            </Button>
            <Button
              data-testid="batch-clear"
              variant="ghost"
              onClick={() => changeInput('')}
            >
              {w('clear')}
            </Button>
          </div>
          <ErrorMessage>{error}</ErrorMessage>
        </Panel>
        <Panel title={w('result')}>
          <Output
            value={result?.output ?? ''}
            filename={options.sqlIn ? 'values.sql' : 'batch.txt'}
          />
          <p
            role="status"
            data-testid="batch-counts"
            className="text-sm text-muted-foreground"
          >
            {result
              ? t('counts', {
                  input: result.inputCount,
                  output: result.outputCount,
                  characters: result.characters,
                })
              : ''}
          </p>
        </Panel>
      </div>
      <Button
        variant="outline"
        aria-expanded={showExtras}
        onClick={() => setShowExtras(!showExtras)}
      >
        {x('textExtras')}
      </Button>
      {showExtras && <TextExtras />}
      <Link
        href="/tools/text-set-operations"
        className="text-primary underline"
      >
        {toolNames('text-set-operations.name')}
      </Link>
    </Workbench>
  )
}

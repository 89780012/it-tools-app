import { useState } from 'react'
import { useTranslations } from '@/i18n/compat'
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
import { queryTextJsonPath, TextJsonPathError } from '@/lib/text-jsonpath'

const example = JSON.stringify(
  {
    store: {
      books: [
        { title: 'Algorithms', price: 12, available: true },
        { title: '诗集', price: 0, available: false },
      ],
      note: null,
    },
  },
  null,
  2,
)
export default function JsonPathQueryPage() {
  const t = useTranslations('tools.jsonpath-query')
  const w = useTranslations('workbench')
  const [input, setInput] = useState('')
  const [path, setPath] = useState('$.store.books[*].title')
  const [includePaths, setIncludePaths] = useState(false)
  const [result, setResult] = useState<ReturnType<
    typeof queryTextJsonPath
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
  const run = () => {
    reset()
    try {
      setResult(queryTextJsonPath(input, path, includePaths))
    } catch (err) {
      setError(
        t(err instanceof TextJsonPathError ? err.message : 'invalidPath'),
      )
    }
  }
  return (
    <Workbench toolId="jsonpath-query">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={w('input')}>
          <Field label={w('input')} htmlFor="jsonpath-input">
            <Textarea
              id="jsonpath-input"
              data-testid="jsonpath-input"
              dir="ltr"
              className="min-h-64 font-mono"
              value={input}
              onChange={(e) => changeInput(e.target.value)}
              spellCheck={false}
            />
          </Field>
          <Field
            label={t('expression')}
            htmlFor="jsonpath-expression"
            hint={t('hint')}
          >
            <Input
              id="jsonpath-expression"
              data-testid="jsonpath-expression"
              dir="ltr"
              className="font-mono"
              value={path}
              onChange={(e) => {
                setPath(e.target.value)
                reset()
              }}
              spellCheck={false}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              data-testid="jsonpath-paths"
              checked={includePaths}
              onChange={(e) => {
                setIncludePaths(e.target.checked)
                reset()
              }}
            />
            {t('paths')}
          </label>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="jsonpath-run" onClick={run}>
              {w('run')}
            </Button>
            <Button
              data-testid="jsonpath-example"
              variant="outline"
              onClick={() => {
                changeInput(example)
                setPath('$.store.books[*].title')
              }}
            >
              {w('example')}
            </Button>
            <Button
              data-testid="jsonpath-filter-example"
              variant="outline"
              onClick={() => {
                changeInput(example)
                setPath('$.store.books[?(@.price < 10)].title')
              }}
            >
              {t('filterExample')}
            </Button>
            <Button
              data-testid="jsonpath-clear"
              variant="ghost"
              onClick={() => changeInput('')}
            >
              {w('clear')}
            </Button>
          </div>
          <ErrorMessage>{error}</ErrorMessage>
        </Panel>
        <Panel title={w('result')}>
          <Output value={result?.output ?? ''} filename="matches.json" />
          <p
            role="status"
            data-testid="jsonpath-count"
            className="text-sm text-muted-foreground"
          >
            {result ? t('matches', { count: result.count }) : ''}
          </p>
        </Panel>
      </div>
    </Workbench>
  )
}
